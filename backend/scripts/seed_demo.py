#!/usr/bin/env python3
"""C-5: siembra la cuenta de demo con datos que se ven reales.

    python scripts/seed_demo.py                                  # local (8001)
    python scripts/seed_demo.py --url https://budgetwise-api-2nve.onrender.com

Llama al API, no a la base de datos. Por eso el mismo script sirve contra local
y contra Render sin cambiar nada, y de paso ejercita los endpoints que se van a
mostrar en la demo: si algo del API está roto, esto falla antes que la
presentación.

Es idempotente: si la cuenta ya existe, borra sus transacciones, metas y
presupuestos antes de sembrar. Correrlo dos veces deja el mismo resultado.

Los montos no son al azar. Están elegidos para que se disparen las reglas de
HU-14 y las alertas de HU-12 — ver `docs/demo.md` para el detalle.
"""
import argparse
import calendar
import sys
from datetime import date

import httpx

EMAIL = "demo@budgetwise.app"
PASSWORD = "demo12345"
NOMBRE = "Cuenta demo"

URL_POR_DEFECTO = "http://localhost:8001"

# El listado del API topa en 200 por página.
PAGINA = 200


# --- Datos de la demo -------------------------------------------------------------------
#
# Tres meses: el actual y los dos anteriores. Los ingresos son quincenales.
#
# El mes actual está calibrado así:
#   - Gasto total 840 000 contra 900 000 de ingreso  -> queda 6,7 %, dispara "ahorro bajo"
#   - Alimentación 185 000 contra un límite de 150 000 -> presupuesto excedido
#   - Transporte    76 000 contra un límite de  90 000 -> presupuesto por agotarse (84 %)
#   - Sin categoría 220 000, o sea 26 % del gasto      -> regla de gastos sin categorizar
#   - Ninguna categoría llega al 50 % del gasto        -> NO dispara "categoría dominante",
#     que sería una sexta recomendación y empujaría fuera a la de sin categorizar.

INGRESOS = {
    -2: [("Salario", 450_000, 15), ("Salario", 450_000, 30)],
    -1: [("Salario", 450_000, 15), ("Salario", 450_000, 30), ("Trabajo freelance", 150_000, 8)],
    0: [("Salario", 450_000, 15), ("Salario", 450_000, 30)],
}

# (categoría o None, descripción, monto, día)
GASTOS = {
    -2: [
        ("Vivienda", "Alquiler", 220_000, 1),
        ("Alimentación", "Supermercado", 95_000, 5),
        ("Alimentación", "Supermercado", 88_000, 18),
        ("Transporte", "Combustible", 62_000, 7),
        ("Servicios", "Electricidad y agua", 48_000, 10),
        ("Servicios", "Internet", 22_000, 12),
        ("Entretenimiento", "Cine y salidas", 35_000, 22),
        ("Salud", "Farmacia", 40_000, 25),
    ],
    -1: [
        ("Vivienda", "Alquiler", 220_000, 1),
        ("Alimentación", "Supermercado", 105_000, 4),
        ("Alimentación", "Supermercado", 97_000, 19),
        ("Transporte", "Combustible", 71_000, 6),
        ("Servicios", "Electricidad y agua", 55_000, 10),
        ("Servicios", "Internet", 22_000, 12),
        ("Educación", "Curso en línea", 60_000, 14),
        ("Entretenimiento", "Salidas", 45_000, 21),
        ("Salud", "Consulta médica", 45_000, 26),
    ],
    0: [
        ("Vivienda", "Alquiler", 220_000, 1),
        ("Alimentación", "Supermercado", 98_000, 3),
        ("Alimentación", "Supermercado", 87_000, 16),
        ("Transporte", "Combustible", 76_000, 5),
        ("Servicios", "Electricidad y agua", 40_000, 9),
        ("Servicios", "Internet", 22_000, 11),
        ("Salud", "Farmacia", 35_000, 13),
        ("Entretenimiento", "Salidas", 42_000, 20),
        (None, "Pago con tarjeta", 120_000, 8),
        (None, "Retiro en efectivo", 60_000, 17),
        (None, "Compra en línea", 40_000, 22),
    ],
}

# Límite mensual GENERAL (sin categoría). Es el que responde «cuánto me queda
# este mes», que es el titular del dashboard. Sin este presupuesto el titular
# cae al saldo y la demo no muestra la pantalla principal como se diseñó.
# 420 000 contra 337 000 de gasto sembrado -> ~80 %, la barra se ve trabajada
# sin estar en rojo.
PRESUPUESTO_GENERAL = 420_000

# categoría -> límite mensual
PRESUPUESTOS = {
    "Alimentación": 150_000,
    "Transporte": 90_000,
}

# (nombre, objetivo, ahorrado, fecha límite)
METAS = [
    ("Fondo de emergencia", 1_000_000, 700_000, None),  # 70 %, va bien
    ("Viaje de fin de año", 600_000, 90_000, "12-31"),  # 15 %, dispara "meta rezagada"
    ("Computadora nueva", 500_000, 200_000, None),  # 40 %
]


def corre_mes(delta: int) -> tuple[int, int]:
    """(año, mes) del mes actual corrido `delta` meses.

    Se opera sobre meses totales y no sobre días: restar 30 días por mes se
    desfasa en febrero y en los meses de 31.
    """
    hoy = date.today()
    total = hoy.year * 12 + (hoy.month - 1) + delta
    return total // 12, total % 12 + 1


def dia_del_mes(delta: int, dia: int) -> str:
    """Fecha ISO dentro del mes `delta`, recortada al último día si no existe."""
    anio, mes = corre_mes(delta)
    return date(anio, mes, min(dia, calendar.monthrange(anio, mes)[1])).isoformat()


class Api:
    """Cliente mínimo del API. Cualquier respuesta de error corta el script."""

    def __init__(self, base_url: str):
        self.cliente = httpx.Client(base_url=base_url.rstrip("/"), timeout=60.0)
        self.token: str | None = None

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def pedir(self, metodo: str, ruta: str, **kwargs) -> httpx.Response:
        respuesta = self.cliente.request(metodo, ruta, headers=self._headers(), **kwargs)
        if respuesta.status_code >= 400:
            sys.exit(f"  {metodo} {ruta} devolvió {respuesta.status_code}: {respuesta.text[:300]}")
        return respuesta

    def entrar(self) -> None:
        """Registra la cuenta demo, o inicia sesión si ya existe."""
        credenciales = {"email": EMAIL, "password": PASSWORD}
        alta = self.cliente.post("/auth/register", json={**credenciales, "name": NOMBRE})
        if alta.status_code == 201:
            self.token = alta.json()["access_token"]
            print(f"  cuenta creada: {EMAIL}")
            return
        if alta.status_code != 409:
            sys.exit(f"  POST /auth/register devolvió {alta.status_code}: {alta.text[:300]}")
        self.token = self.pedir("POST", "/auth/login", json=credenciales).json()["access_token"]
        print(f"  cuenta existente, sesión iniciada: {EMAIL}")


def limpiar(api: Api) -> None:
    """Borra transacciones, metas y presupuestos de la cuenta demo.

    Las categorías NO se tocan: son las nueve por defecto que crea el registro
    (HU-03) y el script se apoya en ellas en vez de crear las suyas.
    """
    borradas = 0
    while True:
        lote = api.pedir("GET", f"/transactions?limit={PAGINA}&offset=0").json()["items"]
        if not lote:
            break
        for movimiento in lote:
            api.pedir("DELETE", f"/transactions/{movimiento['id']}")
            borradas += 1

    metas = api.pedir("GET", "/goals").json()
    for meta in metas:
        api.pedir("DELETE", f"/goals/{meta['id']}")

    presupuestos = api.pedir("GET", "/budgets/status").json()["budgets"]
    for presupuesto in presupuestos:
        api.pedir("DELETE", f"/budgets/{presupuesto['id']}")

    if borradas or metas or presupuestos:
        print(
            f"  limpieza: {borradas} movimientos, {len(metas)} metas, "
            f"{len(presupuestos)} presupuestos"
        )


def sembrar_movimientos(api: Api, categorias: dict[str, int]) -> int:
    total = 0
    for delta in (-2, -1, 0):
        for descripcion, monto, dia in INGRESOS[delta]:
            api.pedir(
                "POST",
                "/transactions",
                json={
                    "type": "income",
                    "amount": monto,
                    "date": dia_del_mes(delta, dia),
                    "category_id": categorias.get("Salario"),
                    "description": descripcion,
                },
            )
            total += 1
        for nombre_categoria, descripcion, monto, dia in GASTOS[delta]:
            api.pedir(
                "POST",
                "/transactions",
                json={
                    "type": "expense",
                    "amount": monto,
                    "date": dia_del_mes(delta, dia),
                    "category_id": categorias.get(nombre_categoria),
                    "description": descripcion,
                },
            )
            total += 1
    return total


def sembrar_presupuestos(api: Api, categorias: dict[str, int]) -> int:
    # Primero el general: category_id en None es lo que lo marca como global.
    api.pedir("PUT", "/budgets", json={"category_id": None, "monthly_limit": PRESUPUESTO_GENERAL})
    for nombre, limite in PRESUPUESTOS.items():
        if nombre not in categorias:
            sys.exit(f"  falta la categoría por defecto «{nombre}»")
        api.pedir(
            "PUT",
            "/budgets",
            json={"category_id": categorias[nombre], "monthly_limit": limite},
        )
    return len(PRESUPUESTOS) + 1


def sembrar_metas(api: Api) -> int:
    anio = date.today().year
    for nombre, objetivo, ahorrado, fecha in METAS:
        meta = api.pedir(
            "POST",
            "/goals",
            json={
                "name": nombre,
                "target_amount": objetivo,
                "due_date": f"{anio}-{fecha}" if fecha else None,
            },
        ).json()
        if ahorrado > 0:
            # Se registra como aporte, que es como la app mueve lo ahorrado.
            api.pedir("POST", f"/goals/{meta['id']}/contributions", json={"amount": ahorrado})
    return len(METAS)


def verificar(api: Api) -> bool:
    """Comprueba los criterios de aceptación del issue. Devuelve True si pasan todos."""
    print("\nVerificación de los criterios de aceptación")
    print("-" * 72)
    fallos = []

    serie = api.pedir("GET", "/transactions/monthly?months=3").json()["months"]
    saldos = [m["balance"] for m in serie]
    for mes in serie:
        print(
            f"  {mes['month']}  ingreso {mes['income']:>10,.0f}  "
            f"gasto {mes['expense']:>10,.0f}  saldo {mes['balance']:>10,.0f}"
        )
    if len(set(saldos)) < len(saldos) or min(saldos) == max(saldos):
        fallos.append("la curva mensual no tiene variación visible")

    recomendaciones = api.pedir("GET", "/ai/recommendations").json()["recommendations"]
    tipos = {r["type"] for r in recomendaciones}
    print(f"\n  recomendaciones: {len(recomendaciones)} de {len(tipos)} reglas distintas")
    for r in recomendaciones:
        print(f"    [{r['severity']:<8}] {r['type']:<28} {r['title']}")
    if len(tipos) < 3:
        fallos.append(f"se esperaban 3 reglas distintas y salieron {len(tipos)}")

    estado = api.pedir("GET", "/budgets/status").json()
    alertas = estado["alerts"]
    print(f"\n  presupuestos con alerta: {len(alertas)}")
    for a in alertas:
        print(f"    {a['category_name']}: {a['spent']:,.0f} de {a['monthly_limit']:,.0f} "
              f"({a['percent_used']:.0f}%) -> {a['status']}")
    if not alertas:
        fallos.append("ningún presupuesto quedó en alerta")

    print("-" * 72)
    if fallos:
        for f in fallos:
            print(f"  NO CUMPLE: {f}")
        return False
    print("  Los cuatro criterios se cumplen.")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Siembra la cuenta de demo de BudgetWise.")
    parser.add_argument(
        "--url",
        default=URL_POR_DEFECTO,
        help=f"URL base del API (por defecto {URL_POR_DEFECTO})",
    )
    args = parser.parse_args()

    print(f"Sembrando contra {args.url}")
    api = Api(args.url)
    api.entrar()
    limpiar(api)

    categorias = {c["name"]: c["id"] for c in api.pedir("GET", "/categories").json()}
    print(f"  categorías disponibles: {len(categorias)}")

    movimientos = sembrar_movimientos(api, categorias)
    presupuestos = sembrar_presupuestos(api, categorias)
    metas = sembrar_metas(api)
    print(f"  sembrado: {movimientos} movimientos, {presupuestos} presupuestos, {metas} metas")

    return 0 if verificar(api) else 1


if __name__ == "__main__":
    sys.exit(main())
