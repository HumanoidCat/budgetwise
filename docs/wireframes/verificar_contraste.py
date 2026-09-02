#!/usr/bin/env python3
"""
Mide el contraste de la paleta de BudgetWise contra WCAG 2.1.

    python verificar_contraste.py

Sale con código 1 si algún par exigido no llega a su mínimo, para que sirva
en CI si algún día se quiere.

LEE los colores de mobile/src/constants/theme.ts. No los copia. Una copia se
desactualiza en silencio: alguien cambia un hex en theme.ts, este script sigue
pasando en verde, y lo que mide es una paleta que ya no existe.

Mínimos que se aplican:
  4.5:1  texto normal                        (WCAG 1.4.3, nivel AA)
  3.0:1  texto grande y bordes de controles  (WCAG 1.4.3 y 1.4.11)
"""

from pathlib import Path
import re
import sys

AQUI = Path(__file__).resolve().parent
THEME = AQUI.parent.parent / "mobile" / "src" / "constants" / "theme.ts"


def leer_paleta(ruta: Path = THEME) -> dict:
    if not ruta.exists():
        sys.exit(f"No encuentro {ruta}. Corré esto desde el repo clonado.")
    bloque = re.search(r"export const Palette\s*=\s*\{(.*?)\}\s*as const;",
                       ruta.read_text(encoding="utf-8"), re.S)
    if not bloque:
        sys.exit("No encontré `export const Palette` en theme.ts.")
    return dict(re.findall(r"(\w+)\s*:\s*'(#[0-9A-Fa-f]{6})'", bloque.group(1)))


def luminancia(hex_color: str) -> float:
    r, g, b = (int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    def canal(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = canal(r), canal(g), canal(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a: str, b: str) -> float:
    la, lb = luminancia(a), luminancia(b)
    claro, oscuro = max(la, lb), min(la, lb)
    return (claro + 0.05) / (oscuro + 0.05)


# Pares que TIENEN que cumplir. (frente, fondo, mínimo, para qué)
EXIGIDOS = [
    ("texto",         "fondo",         4.5, "Texto principal sobre la pantalla"),
    ("texto",         "superficie",    4.5, "Texto principal sobre tarjeta"),
    ("textoSuave",    "fondo",         4.5, "Etiquetas y fechas sobre la pantalla"),
    ("textoSuave",    "superficie",    4.5, "Etiquetas y fechas sobre tarjeta"),
    ("primario",      "fondo",         4.5, "Enlaces sobre la pantalla"),
    ("primario",      "superficie",    4.5, "Enlaces sobre tarjeta"),
    ("primario",      "primarioSuave", 4.5, "Texto de chip seleccionado"),
    ("primarioTexto", "primario",      4.5, "Texto del botón principal"),
    ("ingreso",       "fondo",         4.5, "Monto de ingreso sobre la pantalla"),
    ("ingreso",       "superficie",    4.5, "Monto de ingreso sobre tarjeta"),
    ("gasto",         "fondo",         4.5, "Monto de gasto y errores"),
    ("gasto",         "superficie",    4.5, "Monto de gasto sobre tarjeta"),
    ("advertencia",   "superficie",    4.5, "Avisos que no son error"),
    ("bordeCampo",    "superficie",    3.0, "Borde de campo de formulario"),
    ("bordeCampo",    "fondo",         3.0, "Borde de campo sobre la pantalla"),
]

# Pares que NO cumplen, y se declaran en vez de esconderse.
DECLARADOS = [
    ("deshabilitado", "superficie",
     "Exento por WCAG 1.4.3: un control inactivo tiene que verse inactivo. "
     "Nunca es el único indicio — el control tampoco responde al toque."),
    ("borde", "superficie",
     "Aceptado: es separación decorativa. Lo que separa la tarjeta del fondo "
     "es que la tarjeta es blanca y el fondo gris, no esta línea."),
]


def main() -> int:
    C = leer_paleta()
    fallos = []

    print(f"Paleta leída de {THEME.name} · {len(C)} colores\n")
    print(f"{'Par':<34}{'Ratio':>8}{'Mínimo':>9}   Para qué")
    print("-" * 100)

    for frente, fondo, minimo, para in EXIGIDOS:
        if frente not in C or fondo not in C:
            fallos.append(f"{frente}/{fondo}: token inexistente en theme.ts")
            continue
        r = contraste(C[frente], C[fondo])
        marca = "ok " if r >= minimo else "NO "
        if r < minimo:
            fallos.append(f"{frente} sobre {fondo}: {r:.2f}:1, "
                          f"necesita {minimo}:1")
        par = f"{frente} sobre {fondo}"
        print(f"{marca}{par:<34}{r:>6.2f}:1{minimo:>7.1f}:1   {para}")

    print("\nNo cumplen, y se declara por qué:")
    print("-" * 100)
    for frente, fondo, razon in DECLARADOS:
        r = contraste(C[frente], C[fondo])
        print(f"   {frente} sobre {fondo}: {r:.2f}:1")
        for linea in _envolver(razon, 92):
            print(f"      {linea}")

    print()
    if fallos:
        print(f"{len(fallos)} par(es) por debajo del mínimo:")
        for f in fallos:
            print(f"  - {f}")
        return 1

    peor = min((contraste(C[a], C[b]), a, b, m) for a, b, m, _ in EXIGIDOS)
    print(f"Los {len(EXIGIDOS)} pares exigidos cumplen. "
          f"El más bajo es {peor[1]} sobre {peor[2]}: {peor[0]:.2f}:1 "
          f"contra un mínimo de {peor[3]}:1.")
    return 0


def _envolver(texto: str, ancho: int) -> list[str]:
    lineas, actual = [], ""
    for p in texto.split():
        if len(f"{actual} {p}".strip()) <= ancho:
            actual = f"{actual} {p}".strip()
        else:
            lineas.append(actual)
            actual = p
    if actual:
        lineas.append(actual)
    return lineas


if __name__ == "__main__":
    sys.exit(main())
