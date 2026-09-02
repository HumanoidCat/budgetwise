#!/usr/bin/env python3
"""
Genera los wireframes de BudgetWise (historia S0-7).

    python generar_wireframes.py

Escribe los 7 SVG en la carpeta donde vive este archivo.

Dos defensas están metidas en el código a propósito, porque son los defectos
que aparecieron en la primera versión y que ninguna comprobación automática
habría atrapado:

1. `pastilla()` calcula el radio como altura/2. SVG recorta `rx` a la mitad
   del ancho y `ry` a la mitad del alto, así que un `rx=999` en un rectángulo
   ancho y bajo no da una pastilla: da una elipse.

2. `nota()` registra la caja de cada anotación y la compara contra todo lo ya
   dibujado. Si se monta sobre otro elemento, el script LEVANTA UNA EXCEPCIÓN
   en vez de escribir un SVG con las notas encimadas.

La paleta se lee de mobile/src/constants/theme.ts, no se copia acá: una copia
se desactualiza en silencio.
"""

from pathlib import Path
import re
import sys

AQUI = Path(__file__).resolve().parent
THEME = AQUI.parent.parent / "mobile" / "src" / "constants" / "theme.ts"

ANCHO, ALTO = 390, 844          # iPhone 14 en puntos
MARGEN = 20
FUENTE = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"


# --------------------------------------------------------------------------
# Paleta
# --------------------------------------------------------------------------

def leer_paleta(ruta: Path = THEME) -> dict:
    """Extrae el objeto `Palette` de theme.ts. No copia los valores."""
    if not ruta.exists():
        sys.exit(f"No encuentro {ruta}. Corré esto desde el repo clonado.")
    texto = ruta.read_text(encoding="utf-8")
    bloque = re.search(r"export const Palette\s*=\s*\{(.*?)\}\s*as const;",
                       texto, re.S)
    if not bloque:
        sys.exit("No encontré `export const Palette` en theme.ts.")
    pares = re.findall(r"(\w+)\s*:\s*'(#[0-9A-Fa-f]{6})'", bloque.group(1))
    if not pares:
        sys.exit("Encontré el bloque Palette pero sin colores adentro.")
    return dict(pares)


C = leer_paleta()


# --------------------------------------------------------------------------
# Lienzo
# --------------------------------------------------------------------------

def esc(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class Lienzo:
    def __init__(self, titulo: str):
        self.titulo = titulo
        self.piezas: list[str] = []
        self.ocupado: list[tuple[float, float, float, float]] = []

    # -- primitivas ---------------------------------------------------------

    def _registrar(self, x, y, w, h):
        self.ocupado.append((x, y, x + w, y + h))

    def rect(self, x, y, w, h, relleno, radio=0, borde=None, grosor=1,
             registrar=True, opacidad=None):
        attrs = [f'x="{x}" y="{y}" width="{w}" height="{h}"',
                 f'fill="{relleno}"']
        if radio:
            attrs.append(f'rx="{radio}"')
        if borde:
            attrs.append(f'stroke="{borde}" stroke-width="{grosor}"')
        if opacidad is not None:
            attrs.append(f'opacity="{opacidad}"')
        self.piezas.append(f'<rect {" ".join(attrs)} />')
        if registrar:
            self._registrar(x, y, w, h)

    def pastilla(self, x, y, w, h, relleno, borde=None, registrar=True):
        """Radio = altura/2. Nunca un número grande: eso da una elipse."""
        self.rect(x, y, w, h, relleno, radio=h / 2, borde=borde,
                  registrar=registrar)

    def texto(self, x, y, contenido, tam=15, color=None, peso="400",
              ancla="start", registrar=True, ancho_aprox=None):
        color = color or C["texto"]
        self.piezas.append(
            f'<text x="{x}" y="{y}" font-family="{FUENTE}" font-size="{tam}" '
            f'font-weight="{peso}" fill="{color}" text-anchor="{ancla}">'
            f'{esc(contenido)}</text>'
        )
        if registrar:
            w = ancho_aprox if ancho_aprox is not None else len(contenido) * tam * 0.55
            x0 = x if ancla == "start" else (x - w if ancla == "end" else x - w / 2)
            self._registrar(x0, y - tam, w, tam * 1.25)

    def linea(self, x1, y1, x2, y2, color=None, grosor=1, guion=None):
        color = color or C["borde"]
        d = f' stroke-dasharray="{guion}"' if guion else ""
        self.piezas.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{color}" stroke-width="{grosor}"{d} />'
        )

    # -- anotaciones --------------------------------------------------------

    def nota(self, x, y, w, contenido, apunta_a=None):
        """
        Anotación del wireframe. Falla si se monta sobre algo ya dibujado.

        Este es el defecto 2, 3 y 4 de la primera versión, convertido en una
        comprobación en vez de en algo que hay que acordarse de mirar.
        """
        tam = 10
        lineas = self._envolver(contenido, w - 16, tam)
        h = 10 + len(lineas) * (tam + 3)
        caja = (x, y, x + w, y + h)

        if y + h > ALTO or x + w > ANCHO or x < 0 or y < 0:
            raise RuntimeError(
                f"[{self.titulo}] la nota «{contenido[:40]}…» se sale del "
                f"lienzo de {ANCHO}x{ALTO}: ocupa hasta "
                f"({x + w:.0f},{y + h:.0f}). Lo que no cabe en el wireframe "
                f"tampoco cabe en el teléfono."
            )

        for (ax, ay, bx, by) in self.ocupado:
            if caja[0] < bx and ax < caja[2] and caja[1] < by and ay < caja[3]:
                raise RuntimeError(
                    f"[{self.titulo}] la nota «{contenido[:40]}…» se monta "
                    f"sobre un elemento en ({ax:.0f},{ay:.0f})-({bx:.0f},{by:.0f}). "
                    f"Movela: la nota va en ({x},{y}) y mide {w}x{h:.0f}."
                )

        self.rect(x, y, w, h, C["primarioSuave"], radio=6)
        for i, ln in enumerate(lineas):
            self.texto(x + 8, y + 15 + i * (tam + 3), ln, tam=tam,
                       color=C["primario"], registrar=False)
        if apunta_a:
            self.linea(x + w / 2, y, apunta_a[0], apunta_a[1],
                       C["primario"], 1, guion="3 3")

    @staticmethod
    def _envolver(texto: str, ancho_px: float, tam: int) -> list[str]:
        por_char = tam * 0.52
        maximo = max(1, int(ancho_px / por_char))
        palabras, lineas, actual = texto.split(), [], ""
        for p in palabras:
            tentativa = f"{actual} {p}".strip()
            if len(tentativa) <= maximo:
                actual = tentativa
            else:
                if actual:
                    lineas.append(actual)
                actual = p
        if actual:
            lineas.append(actual)
        return lineas

    # -- piezas compartidas -------------------------------------------------

    def barra_estado(self):
        self.texto(MARGEN, 26, "9:41", tam=13, peso="600", registrar=False)
        self.texto(ANCHO - MARGEN, 26, "▮▮▮  ▲  ▰", tam=11,
                   color=C["textoSuave"], ancla="end", registrar=False)
        self._registrar(0, 0, ANCHO, 34)

    def encabezado(self, titulo, accion=None):
        self.texto(MARGEN, 72, titulo, tam=22, peso="700")
        if accion:
            self.texto(ANCHO - MARGEN, 70, accion, tam=15,
                       color=C["primario"], ancla="end")

    def campo(self, y, etiqueta, valor, marcador=True, borde=None, alto=48):
        self.texto(MARGEN, y, etiqueta, tam=13, color=C["textoSuave"])
        self.rect(MARGEN, y + 8, ANCHO - MARGEN * 2, alto, C["superficie"],
                  radio=10, borde=borde or C["bordeCampo"])
        self.texto(MARGEN + 14, y + 8 + alto / 2 + 5, valor, tam=15,
                   color=C["textoSuave"] if marcador else C["texto"],
                   registrar=False)
        return y + 8 + alto

    def boton(self, y, etiqueta, activo=True, alto=52):
        relleno = C["primario"] if activo else C["deshabilitado"]
        self.rect(MARGEN, y, ANCHO - MARGEN * 2, alto, relleno, radio=12)
        self.texto(ANCHO / 2, y + alto / 2 + 6, etiqueta, tam=16, peso="600",
                   color=C["primarioTexto"], ancla="middle", registrar=False)
        return y + alto

    def barra_pestanas(self, activa):
        y = ALTO - 84
        self.rect(0, y, ANCHO, 84, C["superficie"], registrar=True)
        self.linea(0, y, ANCHO, y, C["borde"])
        etiquetas = ["Inicio", "Movimientos", "Metas", "Ajustes"]
        paso = ANCHO / len(etiquetas)
        for i, e in enumerate(etiquetas):
            cx = paso * i + paso / 2
            sel = e == activa
            color = C["primario"] if sel else C["textoSuave"]
            self.rect(cx - 11, y + 18, 22, 22, color, radio=6,
                      registrar=False, opacidad=1 if sel else 0.45)
            self.texto(cx, y + 56, e, tam=11, color=color, ancla="middle",
                       peso="600" if sel else "400", registrar=False)

    # -- salida -------------------------------------------------------------

    def guardar(self, nombre):
        cuerpo = "\n  ".join(self.piezas)
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{ANCHO}" '
            f'height="{ALTO}" viewBox="0 0 {ANCHO} {ALTO}" '
            f'role="img" aria-label="{esc(self.titulo)}">\n'
            f'  <title>{esc(self.titulo)}</title>\n'
            f'  <rect width="{ANCHO}" height="{ALTO}" fill="{C["fondo"]}" />\n'
            f'  {cuerpo}\n</svg>\n'
        )
        (AQUI / nombre).write_text(svg, encoding="utf-8")
        return nombre


# --------------------------------------------------------------------------
# Pantallas
# --------------------------------------------------------------------------

def login():
    L = Lienzo("Iniciar sesión")
    L.barra_estado()
    L.texto(MARGEN, 108, "BudgetWise", tam=28, peso="700")
    L.texto(MARGEN, 134, "Ordená tus ingresos y gastos.", tam=15,
            color=C["textoSuave"])

    y = L.campo(190, "Correo", "avril@correo.com", marcador=False)
    y = L.campo(y + 26, "Contraseña", "••••••••", marcador=False,
                borde=C["gasto"])
    L.texto(MARGEN, y + 22, "Correo o contraseña incorrectos", tam=13,
            color=C["gasto"])

    y = L.boton(y + 52, "Iniciar sesión")
    L.texto(ANCHO / 2, y + 34, "¿No tenés cuenta? Crear cuenta", tam=14,
            color=C["primario"], ancla="middle")

    L.nota(MARGEN, y + 66, ANCHO - MARGEN * 2,
           "El error que devuelve el API se muestra aquí, bajo el campo, y el "
           "borde del campo se pone en color de error. HU-06 pide que los "
           "errores del API sean visibles para la persona.")
    L.nota(MARGEN, y + 152, ANCHO - MARGEN * 2,
           "Si ya hay sesión guardada en SecureStore, esta pantalla no se ve: "
           "la app entra directo a Inicio.")
    return L.guardar("01-login.svg")


def registro():
    L = Lienzo("Crear cuenta")
    L.barra_estado()
    L.encabezado("Crear cuenta", accion="Cancelar")
    L.texto(MARGEN, 98, "Se crean nueve categorías para empezar.", tam=14,
            color=C["textoSuave"])

    y = L.campo(140, "Nombre", "Avril Madrigal", marcador=False)
    y = L.campo(y + 22, "Correo", "avril@correo.com", marcador=False)
    y = L.campo(y + 22, "Contraseña", "••••••••••", marcador=False)
    L.texto(MARGEN, y + 20, "Mínimo 8 caracteres.", tam=12,
            color=C["textoSuave"])

    y = L.boton(y + 46, "Crear cuenta")
    L.texto(ANCHO / 2, y + 34, "¿Ya tenés cuenta? Iniciar sesión", tam=14,
            color=C["primario"], ancla="middle")

    L.nota(MARGEN, y + 66, ANCHO - MARGEN * 2,
           "Validación en el cliente antes de llamar al API: formato de correo "
           "y contraseña de 8 caracteres o más. El botón queda inactivo "
           "mientras algo no cumpla.")
    return L.guardar("02-registro.svg")


def inicio():
    L = Lienzo("Inicio")
    L.barra_estado()
    L.texto(MARGEN, 72, "Hola, Avril", tam=22, peso="700")
    L.texto(MARGEN, 94, "Agosto 2026", tam=13, color=C["textoSuave"])

    # Saldo
    L.rect(MARGEN, 112, ANCHO - MARGEN * 2, 96, C["superficie"], radio=14,
           borde=C["borde"])
    L.texto(MARGEN + 18, 142, "Saldo actual", tam=13, color=C["textoSuave"])
    L.texto(MARGEN + 18, 180, "₡ 462 600", tam=30, peso="700", registrar=False)

    # Ingresos / gastos
    ancho_med = (ANCHO - MARGEN * 2 - 12) / 2
    L.rect(MARGEN, 224, ancho_med, 82, C["superficie"], radio=14,
           borde=C["borde"])
    L.texto(MARGEN + 14, 250, "Ingresos", tam=12, color=C["textoSuave"])
    L.texto(MARGEN + 14, 280, "+ 480 000", tam=18, peso="700",
            color=C["ingreso"], registrar=False)

    x2 = MARGEN + ancho_med + 12
    L.rect(x2, 224, ancho_med, 82, C["superficie"], radio=14, borde=C["borde"])
    L.texto(x2 + 14, 250, "Gastos", tam=12, color=C["textoSuave"])
    L.texto(x2 + 14, 280, "- 18 400", tam=18, peso="700", color=C["gasto"],
            registrar=False)

    # Gastos por categoría
    L.texto(MARGEN, 344, "Gastos por categoría", tam=16, peso="600")
    filas = [("Comida", 46, C["primario"]), ("Transporte", 28, C["ingreso"]),
             ("Servicios", 16, C["advertencia"]), ("Otros", 10, C["textoSuave"])]
    y = 366
    for nombre, pct, color in filas:
        L.texto(MARGEN, y + 12, nombre, tam=13, color=C["textoSuave"])
        L.texto(ANCHO - MARGEN, y + 12, f"{pct} %", tam=13, ancla="end",
                color=C["textoSuave"])
        pista_y = y + 20
        L.pastilla(MARGEN, pista_y, ANCHO - MARGEN * 2, 10, C["borde"])
        L.pastilla(MARGEN, pista_y, (ANCHO - MARGEN * 2) * pct / 100, 10,
                   color, registrar=False)
        y += 48

    # Evolución mensual
    L.texto(MARGEN, y + 22, "Evolución mensual", tam=16, peso="600")
    base = y + 118
    meses = [("May", 38), ("Jun", 54), ("Jul", 30), ("Ago", 62)]
    paso = (ANCHO - MARGEN * 2) / len(meses)
    for i, (mes, alt) in enumerate(meses):
        bx = MARGEN + paso * i + paso * 0.2
        bw = paso * 0.6
        L.rect(bx, base - alt, bw, alt, C["primario"], radio=4)
        L.texto(bx + bw / 2, base + 16, mes, tam=11, color=C["textoSuave"],
                ancla="middle")

    L.barra_pestanas("Inicio")
    return L.guardar("03-inicio.svg")


def movimientos():
    L = Lienzo("Movimientos")
    L.barra_estado()
    L.encabezado("Movimientos", accion="+ Nuevo")

    # Filtros
    y = 96
    for i, (etiqueta, sel) in enumerate([("Todos", True), ("Ingresos", False),
                                         ("Gastos", False)]):
        w = 22 + len(etiqueta) * 8
        x = MARGEN + sum(22 + len(e) * 8 + 8 for e, _ in
                         [("Todos", True), ("Ingresos", False),
                          ("Gastos", False)][:i])
        L.pastilla(x, y, w, 32, C["primarioSuave"] if sel else C["superficie"],
                   borde=None if sel else C["borde"])
        L.texto(x + w / 2, y + 21, etiqueta, tam=13,
                color=C["primario"] if sel else C["textoSuave"],
                peso="600" if sel else "400", ancla="middle", registrar=False)

    L.texto(MARGEN, 158, "Hoy", tam=12, color=C["textoSuave"], peso="600")
    L.linea(MARGEN, 166, ANCHO - MARGEN, 166)

    filas = [
        ("Comida", "Almuerzo", "- 4 200", C["gasto"]),
        ("Transporte", "Bus", "- 1 400", C["gasto"]),
        ("Salario", "Quincena", "+ 240 000", C["ingreso"]),
    ]
    y = 178
    for cat, desc, monto, color in filas:
        L.rect(MARGEN, y, ANCHO - MARGEN * 2, 64, C["superficie"], radio=12,
               borde=C["borde"])
        L.texto(MARGEN + 14, y + 26, cat, tam=15, peso="600", registrar=False)
        L.texto(MARGEN + 14, y + 46, desc, tam=12, color=C["textoSuave"],
                registrar=False)
        L.texto(ANCHO - MARGEN - 14, y + 38, monto, tam=16, peso="700",
                color=color, ancla="end", registrar=False)
        y += 72

    L.texto(MARGEN, y + 16, "31 de agosto", tam=12, color=C["textoSuave"],
            peso="600")
    L.linea(MARGEN, y + 24, ANCHO - MARGEN, y + 24)
    y += 36
    for cat, desc, monto, color in [("Servicios", "Internet", "- 22 000",
                                     C["gasto"])]:
        L.rect(MARGEN, y, ANCHO - MARGEN * 2, 64, C["superficie"], radio=12,
               borde=C["borde"])
        L.texto(MARGEN + 14, y + 26, cat, tam=15, peso="600", registrar=False)
        L.texto(MARGEN + 14, y + 46, desc, tam=12, color=C["textoSuave"],
                registrar=False)
        L.texto(ANCHO - MARGEN - 14, y + 38, monto, tam=16, peso="700",
                color=color, ancla="end", registrar=False)
        y += 72

    L.nota(MARGEN, y + 14, ANCHO - MARGEN * 2,
           "Deslizar hacia abajo recarga la lista. Vacía dice «Todavía no hay "
           "movimientos» con el botón para crear el primero.")

    L.barra_pestanas("Movimientos")
    return L.guardar("04-movimientos.svg")


def movimiento_alta():
    L = Lienzo("Nuevo movimiento")
    L.barra_estado()
    L.encabezado("Nuevo movimiento", accion="Cerrar")

    # Selector de tipo
    L.texto(MARGEN, 118, "Tipo", tam=13, color=C["textoSuave"])
    ancho_seg = (ANCHO - MARGEN * 2) / 2
    L.rect(MARGEN, 128, ANCHO - MARGEN * 2, 44, C["superficie"], radio=10,
           borde=C["borde"])
    L.rect(MARGEN + 3, 131, ancho_seg - 6, 38, C["primarioSuave"], radio=8,
           registrar=False)
    L.texto(MARGEN + ancho_seg / 2, 155, "Gasto", tam=15, peso="700",
            color=C["primario"], ancla="middle", registrar=False)
    L.texto(MARGEN + ancho_seg * 1.5, 155, "Ingreso", tam=15,
            color=C["textoSuave"], ancla="middle", registrar=False)

    # Monto
    L.texto(MARGEN, 208, "Monto", tam=13, color=C["textoSuave"])
    L.rect(MARGEN, 216, ANCHO - MARGEN * 2, 64, C["superficie"], radio=10,
           borde=C["bordeCampo"])
    L.texto(MARGEN + 16, 258, "₡", tam=20, color=C["textoSuave"],
            registrar=False)
    L.texto(MARGEN + 42, 258, "- 4 200", tam=26, peso="700", color=C["gasto"],
            registrar=False)

    # Categoría
    L.texto(MARGEN, 314, "Categoría", tam=13, color=C["textoSuave"])
    y = 324
    cats = [("Comida", True), ("Transporte", False), ("Servicios", False),
            ("Salud", False)]
    x = MARGEN
    for etiqueta, sel in cats:
        w = 22 + len(etiqueta) * 8
        if x + w > ANCHO - MARGEN:
            x = MARGEN
            y += 42
        L.pastilla(x, y, w, 34, C["primarioSuave"] if sel else C["superficie"],
                   borde=None if sel else C["borde"])
        L.texto(x + w / 2, y + 22, etiqueta, tam=13,
                color=C["primario"] if sel else C["textoSuave"],
                peso="600" if sel else "400", ancla="middle", registrar=False)
        x += w + 8

    y = L.campo(y + 58, "Fecha", "1 de septiembre de 2026", marcador=False,
                alto=44)
    y = L.campo(y + 18, "Nota", "Almuerzo", marcador=False, alto=44)

    y = L.boton(y + 28, "Guardar movimiento")

    L.nota(MARGEN, y + 20, ANCHO - MARGEN * 2,
           "El botón es azul a propósito. Justo arriba hay un monto en rojo: "
           "si el botón fuera verde, el mismo verde significaría «ingreso» y "
           "«guardar» en la misma pantalla.")
    return L.guardar("05-movimiento-alta.svg")


def metas():
    L = Lienzo("Metas")
    L.barra_estado()
    L.encabezado("Metas", accion="+ Nueva")

    metas_datos = [
        ("Fondo de emergencia", 62, "₡ 620 000 de ₡ 1 000 000"),
        ("Viaje de fin de año", 35, "₡ 105 000 de ₡ 300 000"),
        ("Computadora", 8, "₡ 40 000 de ₡ 500 000"),
    ]
    y = 108
    for nombre, pct, detalle in metas_datos:
        L.rect(MARGEN, y, ANCHO - MARGEN * 2, 118, C["superficie"], radio=14,
               borde=C["borde"])
        L.texto(MARGEN + 16, y + 30, nombre, tam=16, peso="600",
                registrar=False)
        L.texto(ANCHO - MARGEN - 16, y + 30, f"{pct} %", tam=14, peso="600",
                color=C["primario"], ancla="end", registrar=False)
        pista_y = y + 52
        L.pastilla(MARGEN + 16, pista_y, ANCHO - MARGEN * 2 - 32, 12,
                   C["borde"], registrar=False)
        L.pastilla(MARGEN + 16, pista_y, (ANCHO - MARGEN * 2 - 32) * pct / 100,
                   12, C["primario"], registrar=False)
        L.texto(MARGEN + 16, y + 92, detalle, tam=13, color=C["textoSuave"],
                registrar=False)
        y += 132

    L.nota(MARGEN, y + 8, ANCHO - MARGEN * 2,
           "La barra es una pastilla: el radio es la mitad del alto (6 para "
           "una barra de 12). Un radio fijo grande la convierte en elipse.")

    L.barra_pestanas("Metas")
    return L.guardar("06-metas.svg")


def ajustes():
    L = Lienzo("Ajustes")
    L.barra_estado()
    L.encabezado("Ajustes")

    # Perfil
    L.rect(MARGEN, 100, ANCHO - MARGEN * 2, 84, C["superficie"], radio=14,
           borde=C["borde"])
    L.rect(MARGEN + 16, 118, 48, 48, C["primarioSuave"], radio=24)
    L.texto(MARGEN + 40, 149, "AM", tam=16, peso="700", color=C["primario"],
            ancla="middle", registrar=False)
    L.texto(MARGEN + 80, 136, "Avril Madrigal", tam=16, peso="600",
            registrar=False)
    L.texto(MARGEN + 80, 158, "avril@correo.com", tam=13,
            color=C["textoSuave"], registrar=False)

    filas = [("Moneda", "Colón (₡)"), ("Categorías", "9 activas"),
             ("Alertas de presupuesto", "Activadas"),
             ("Exportar movimientos", "CSV")]
    y = 212
    for etiqueta, valor in filas:
        L.rect(MARGEN, y, ANCHO - MARGEN * 2, 58, C["superficie"], radio=12,
               borde=C["borde"])
        L.texto(MARGEN + 16, y + 35, etiqueta, tam=15, registrar=False)
        L.texto(ANCHO - MARGEN - 16, y + 35, valor, tam=13,
                color=C["textoSuave"], ancla="end", registrar=False)
        y += 66

    y += 12
    L.rect(MARGEN, y, ANCHO - MARGEN * 2, 52, C["superficie"], radio=12,
           borde=C["gasto"])
    L.texto(ANCHO / 2, y + 32, "Cerrar sesión", tam=15, peso="600",
            color=C["gasto"], ancla="middle", registrar=False)

    L.nota(MARGEN, y + 70, ANCHO - MARGEN * 2,
           "Cerrar sesión borra el token de SecureStore y devuelve a la "
           "pantalla de inicio de sesión. Pide confirmación antes.")

    L.barra_pestanas("Ajustes")
    return L.guardar("07-ajustes.svg")


# --------------------------------------------------------------------------

def main():
    for f in (login, registro, inicio, movimientos, movimiento_alta, metas,
              ajustes):
        print("escrito:", f())
    print(f"\n7 archivos en {AQUI}  ({ANCHO}x{ALTO})")


if __name__ == "__main__":
    main()
