# Wireframes y sistema visual · S0-7

Wireframes de las 6 pantallas del backlog y los tokens visuales de la app.

| Archivo | Pantalla | Historia |
|---|---|---|
| `01-login.svg` | Iniciar sesión | HU-06 |
| `02-registro.svg` | Crear cuenta | HU-06 |
| `03-inicio.svg` | Inicio / dashboard | HU-13 |
| `04-movimientos.svg` | Lista de movimientos | HU-07 |
| `05-movimiento-alta.svg` | Alta y edición de movimiento | HU-07 |
| `06-metas.svg` | Metas de ahorro | Sprint 2 |
| `07-ajustes.svg` | Ajustes | Sprint 2 |

Son 7 archivos para 6 pantallas del backlog: la lista de movimientos y el
formulario de alta son dos vistas de la misma pantalla, y separarlas era la
única forma de mostrar el selector de tipo y el de categoría, que son la mitad
de los criterios de aceptación de HU-07.

Todos están a **390 × 844**, el tamaño real de un iPhone 14 en puntos. Lo que no
cabe en el wireframe tampoco va a caber en el teléfono de la demo.

## Cómo regenerarlos

```bash
cd docs/wireframes
python generar_wireframes.py     # escribe los 7 SVG
python verificar_contraste.py    # mide la paleta contra WCAG
```

Los dos scripts leen la paleta de `mobile/src/constants/theme.ts`. No la copian.
Una copia se desactualiza en silencio: alguien cambia un hex en `theme.ts`, la
verificación sigue pasando en verde, y lo que mide es una paleta que ya no
existe.

## La decisión que ordena la paleta

**El color primario es azul (`#2A5BD7`), no verde.** Va en contra de lo que hace
casi toda app de finanzas, y el motivo es concreto: en BudgetWise el verde y el
rojo **ya significan** ingreso y gasto. Son los dos únicos colores que cargan un
dato por sí solos.

Si además el botón de guardar es verde, el mismo verde significa dos cosas en la
misma pantalla. En `05-movimiento-alta.svg` pasaría literalmente: un botón verde
justo debajo de un monto en rojo.

De ahí sale una regla que aplica a todas las pantallas: **el color nunca va
solo.**

- Cada monto lleva su signo: `+ 480 000`, `- 18 400`.
- El selector de tipo dice «Gasto» e «Ingreso» con palabras, no solo con color.
- Cada tramo del gráfico de categorías lleva su etiqueta y su porcentaje.

Alrededor del 8 % de los hombres no distingue rojo de verde. Con signo y
etiqueta, la pantalla sigue siendo legible sin ver el color.

## Paleta

| Token | Valor | Para qué |
|---|---|---|
| `fondo` | `#F5F7FA` | Fondo de pantalla |
| `superficie` | `#FFFFFF` | Tarjetas, campos, barras |
| `texto` | `#14181F` | Texto principal |
| `textoSuave` | `#5A6474` | Etiquetas, fechas, texto secundario |
| `borde` | `#E2E7EE` | Separación decorativa entre tarjetas |
| `bordeCampo` | `#868D99` | Borde de campos de formulario |
| `primario` | `#2A5BD7` | Botones, enlaces, pestaña activa, foco |
| `primarioTexto` | `#FFFFFF` | Texto sobre `primario` |
| `primarioSuave` | `#EAF0FE` | Chips y estados seleccionados |
| `ingreso` | `#0F7A44` | Dinero que entra |
| `gasto` | `#B32D33` | Dinero que sale, y errores |
| `advertencia` | `#8A5300` | Avisos que no son error |
| `deshabilitado` | `#98A1AE` | Controles inactivos |

Solo modo claro. El modo oscuro queda fuera del alcance del MVP del 16 de
septiembre. `Colors.dark` sigue existiendo en `theme.ts` porque lo usa el
andamiaje de Expo, pero las pantallas de BudgetWise no lo consumen.

## Contraste

Los **15 pares exigidos cumplen** su mínimo de WCAG. El más bajo es `bordeCampo`
sobre `fondo`, con 3.11:1 contra un mínimo de 3:1.

Dos pares no cumplen, y se declaran en vez de esconderse:

- `deshabilitado` sobre `superficie` (2.61:1) — exento por WCAG 1.4.3: un
  control inactivo tiene que verse inactivo, y el color no es el único indicio,
  porque el control tampoco responde al toque.
- `borde` sobre `superficie` (1.24:1) — aceptado: es separación decorativa. Lo
  que separa la tarjeta del fondo es que la tarjeta es blanca y el fondo gris,
  no esa línea.

`bordeCampo` pasó de `#8A929E` a `#868D99` durante la verificación. El borde de
un campo tiene dos lados: por dentro es blanco y por fuera es el fondo gris, y
WCAG 1.4.11 lo mide contra los dos. El valor anterior daba 3.14:1 contra el
blanco pero **2.93:1 contra el fondo**, por debajo del mínimo. El nuevo deja
3.34:1 y 3.11:1.

## Tipografía y espaciado

La familia es la del sistema (`Fonts` en `theme.ts`): San Francisco en iOS,
Roboto en Android. No se cargan tipografías propias — en un MVP con demo en vivo
es peso y riesgo sin ganancia.

Escala de tamaños, en `FontSize`:

| Token | pt | Para qué |
|---|---|---|
| `monto` | 28 | Saldo y montos grandes |
| `titulo` | 22 | Título de pantalla |
| `subtitulo` | 17 | Encabezado de sección |
| `cuerpo` | 15 | Texto general y campos |
| `etiqueta` | 13 | Etiquetas de campo, fechas |
| `micro` | 11 | Pestañas, notas al pie |

El espaciado usa la escala `Spacing` que **ya venía** en `theme.ts`
(2/4/8/16/24/32/64). No se inventó otra: dos escalas de espaciado conviviendo es
la vía rápida a pantallas que no calzan entre sí.

## Estados de la interfaz

Cada pantalla que trae datos del API necesita tres estados además del normal, y
en la demo se nota muchísimo cuando faltan:

- **Cargando** — esqueleto o indicador, nunca una pantalla en blanco.
- **Error** — qué pasó y cómo salir de ahí. En `01-login.svg` está dibujado: el
  mensaje del API va bajo el campo y el borde se pone en color de error.
- **Vacío** — una invitación a actuar, no un mensaje triste. En movimientos:
  «Todavía no hay movimientos», con el botón para crear el primero.

Los wireframes muestran el estado con datos. Los otros tres se implementan
igual, con los mismos tokens.

## Defectos encontrados al mirarlos

Los SVG se generaron, se exportaron a PNG y **se miraron**. Un script que
termina sin error no dice que el dibujo esté bien, dice que no falló.

De la primera versión:

1. **Las barras de progreso y los chips salieron como elipses.** Estaban con
   `rx=999` para hacer una pastilla, pero SVG recorta `rx` a la mitad del ancho
   y `ry` a la mitad del alto: en un rectángulo ancho y bajo, eso da una elipse.
   El radio de una pastilla es la mitad del alto.
2. La nota «Deslizar hacia abajo recarga la lista» caía encima del separador
   «Hoy» de la lista.
3. La nota del error del API se montaba sobre el borde del campo de contraseña.
4. La nota del cierre de sesión pisaba el borde de la tarjeta de arriba.

De la segunda:

5. En `02-registro.svg`, el enlace decía «Ya tengo cuenta Iniciar sesión», que se
   lee como una frase rota. Ahora es «¿Ya tenés cuenta? Iniciar sesión».
6. `bordeCampo` no llegaba al mínimo de contraste contra el fondo (ver arriba).

Los tres defectos de posición (2, 3 y 4) no volvieron porque dejaron de depender
de que alguien se acuerde de mirar: `generar_wireframes.py` registra la caja de
cada elemento que dibuja y **levanta una excepción** si una nota se monta sobre
algo, o si se sale de los 390 × 844. El defecto 1 tampoco, porque el radio de
pastilla se calcula como altura ÷ 2 en vez de escribirse a mano.

Lo que ninguna comprobación atrapa sigue siendo la copia y la jerarquía visual.
Eso hay que mirarlo.
