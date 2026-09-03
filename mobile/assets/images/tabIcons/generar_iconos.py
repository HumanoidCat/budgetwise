#!/usr/bin/env python3
"""
Genera los iconos de la barra de pestañas de BudgetWise.

    python generar_iconos.py

Escribe <nombre>.png, <nombre>@2x.png y <nombre>@3x.png en esta carpeta.

Formato: copia el de home.png, que vino con el andamiaje de Expo.
  24x24, 48x48 y 72x72, RGBA, silueta negra sólida sobre transparente.

El negro no se ve nunca: `NativeTabs` los carga con renderingMode="template",
que descarta el color y usa solo la forma, tiñéndola con el color de la
pestaña (activa o inactiva). Por eso son siluetas macizas y no dibujos de
línea: un contorno fino se pierde a 24 puntos.

Se dibuja a 8x y se reduce con LANCZOS. Dibujar directo a 24x24 da bordes
dentados, porque ImageDraw no suaviza.
"""

from pathlib import Path
import math

from PIL import Image, ImageDraw

AQUI = Path(__file__).resolve().parent

LADO = 24          # lienzo lógico, en puntos
SUPER = 8          # se dibuja a 8x y se reduce
TAMANOS = [(LADO, ''), (LADO * 2, '@2x'), (LADO * 3, '@3x')]

NEGRO = (0, 0, 0, 255)
NADA = (0, 0, 0, 0)


def lienzo() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new('RGBA', (LADO * SUPER, LADO * SUPER), NADA)
    return im, ImageDraw.Draw(im)


def e(*valores: float) -> list[float]:
    """Escala coordenadas lógicas al lienzo grande."""
    return [v * SUPER for v in valores]


def normalizar(im: Image.Image, objetivo: float = 18.0) -> Image.Image:
    """
    Deja la silueta en una caja del mismo tamaño que la de home.png.

    home.png ocupa 18x19 de sus 24x24, con unos 3 puntos de aire alrededor.
    Un icono que llega al borde se ve más grande que sus vecinos aunque mida
    lo mismo, así que en vez de ajustar cada dibujo a ojo se recorta a su
    contenido y se reescala aquí.
    """
    caja = im.split()[-1].getbbox()
    if caja is None:
        return im
    recorte = im.crop(caja)
    lado_max = max(recorte.size)
    escala = (objetivo * SUPER) / lado_max
    nuevo = (max(1, round(recorte.width * escala)), max(1, round(recorte.height * escala)))
    recorte = recorte.resize(nuevo, Image.LANCZOS)

    salida = Image.new('RGBA', (LADO * SUPER, LADO * SUPER), NADA)
    salida.paste(
        recorte,
        ((salida.width - nuevo[0]) // 2, (salida.height - nuevo[1]) // 2),
        recorte,
    )
    return salida


def guardar(im: Image.Image, nombre: str) -> None:
    im = normalizar(im)
    for lado, sufijo in TAMANOS:
        im.resize((lado, lado), Image.LANCZOS).save(AQUI / f'{nombre}{sufijo}.png')
    print(f'{nombre}: ' + ', '.join(f'{l}x{l}' for l, _ in TAMANOS))


# --------------------------------------------------------------------------


def movimientos() -> None:
    """Dos flechas, una que sube y otra que baja: entra y sale dinero."""
    im, d = lienzo()

    # Flecha que sube, a la izquierda.
    d.polygon([*e(7.5, 2.5), *e(2.5, 9.5), *e(12.5, 9.5)], fill=NEGRO)
    d.rectangle([*e(5.2, 9.0), *e(9.8, 21.5)], fill=NEGRO)

    # Flecha que baja, a la derecha.
    d.polygon([*e(16.5, 21.5), *e(11.5, 14.5), *e(21.5, 14.5)], fill=NEGRO)
    d.rectangle([*e(14.2, 2.5), *e(18.8, 15.0)], fill=NEGRO)

    guardar(im, 'movimientos')


def metas() -> None:
    """Diana: un anillo y el centro. Una meta es algo a lo que se apunta."""
    im, d = lienzo()
    c = LADO / 2

    d.ellipse([*e(c - 10.5, c - 10.5), *e(c + 10.5, c + 10.5)], fill=NEGRO)
    d.ellipse([*e(c - 6.3, c - 6.3), *e(c + 6.3, c + 6.3)], fill=NADA)
    d.ellipse([*e(c - 3.9, c - 3.9), *e(c + 3.9, c + 3.9)], fill=NEGRO)

    guardar(im, 'metas')


def ajustes() -> None:
    """Engranaje: ocho dientes y el agujero central."""
    im, d = lienzo()
    c = LADO / 2
    dientes = 8
    r_punta, r_valle = 11.0, 7.6
    # Cada diente ocupa la mitad de su sector; el resto es valle.
    paso = 2 * math.pi / dientes
    puntos: list[float] = []

    for i in range(dientes):
        base = i * paso
        # Cuatro esquinas por diente, con los flancos ligeramente inclinados
        # para que no parezca una estrella.
        for ang, r in (
            (base - paso * 0.30, r_valle),
            (base - paso * 0.19, r_punta),
            (base + paso * 0.19, r_punta),
            (base + paso * 0.30, r_valle),
        ):
            puntos += e(c + r * math.cos(ang), c + r * math.sin(ang))

    d.polygon(puntos, fill=NEGRO)
    d.ellipse([*e(c - 8.4, c - 8.4), *e(c + 8.4, c + 8.4)], fill=NEGRO)
    d.ellipse([*e(c - 3.3, c - 3.3), *e(c + 3.3, c + 3.3)], fill=NADA)

    guardar(im, 'ajustes')


if __name__ == '__main__':
    movimientos()
    metas()
    ajustes()
    print(f'\nEn {AQUI}')
