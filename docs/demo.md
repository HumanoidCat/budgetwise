# Datos de demo (C-5)

Para la presentación del 16 de septiembre hace falta una cuenta con historial:
el gráfico de evolución mensual (HU-19), las recomendaciones de IA (HU-14) y las
alertas de presupuesto (HU-12) no muestran nada útil con una cuenta vacía.

`backend/scripts/seed_demo.py` siembra esa cuenta en un comando.

## Cuenta

| | |
|---|---|
| Correo | `demo@budgetwise.app` |
| Contraseña | `demo12345` |

Es una cuenta de demostración con datos inventados. No usar esa contraseña para
nada real.

## Cómo correrlo

Contra el API local:

```bash
cd backend
alembic upgrade head          # solo si la base es nueva
uvicorn app.main:app --reload --port 8001

# en otra terminal
cd backend
python scripts/seed_demo.py
```

Contra el backend desplegado:

```bash
python scripts/seed_demo.py --url https://budgetwise-api-2nve.onrender.com
```

Render duerme los servicios del plan gratuito, así que la primera petición puede
tardar 30–50 segundos. El script espera hasta 60 por llamada.

**Se puede correr las veces que haga falta.** Si la cuenta ya existe, borra sus
movimientos, metas y presupuestos antes de sembrar; correrlo dos veces deja
exactamente el mismo resultado. Las nueve categorías por defecto no se tocan: el
script se apoya en las que crea el registro (HU-03) en vez de crear las suyas.

El script llama al API, no a la base de datos. Por eso el mismo archivo sirve en
local y en Render sin cambiar nada, y de paso ejercita los endpoints de la demo:
si algo del API está roto, esto falla antes que la presentación.

## Qué siembra

Tres meses —el actual y los dos anteriores— con ingresos quincenales de ₡450 000
y gastos repartidos en las categorías por defecto.

| Mes | Ingresos | Gastos | Saldo |
|---|---|---|---|
| hace dos meses | 900 000 | 610 000 | 290 000 |
| mes anterior | 1 050 000 | 720 000 | 330 000 |
| mes actual | 900 000 | 840 000 | 60 000 |

El mes anterior tiene un ingreso extra por trabajo freelance y el actual un gasto
alto, para que la curva del gráfico suba y baje en vez de ser una línea plana.

**Presupuestos del mes actual**

| Categoría | Límite | Gastado | Estado |
|---|---|---|---|
| Alimentación | 150 000 | 185 000 | excedido (123 %) |
| Transporte | 90 000 | 76 000 | por agotarse (84 %) |

**Metas**

| Meta | Objetivo | Ahorrado | Avance |
|---|---|---|---|
| Fondo de emergencia | 1 000 000 | 700 000 | 70 % |
| Computadora nueva | 500 000 | 200 000 | 40 % |
| Viaje de fin de año | 600 000 | 90 000 | 15 % |

## Qué se espera ver

Al terminar, el script verifica solo los criterios de aceptación e imprime el
resultado. Con estos datos:

- **`GET /transactions/monthly?months=3`** devuelve una curva con variación
  visible: 290 000, 330 000 y 60 000.
- **`GET /budgets/status`** devuelve dos alertas, una `exceeded` y una `warning`.
- **`GET /ai/recommendations`** devuelve cinco recomendaciones de cinco reglas
  distintas:

| Severidad | Regla | Por qué se dispara |
|---|---|---|
| critical | `presupuesto_excedido` | Alimentación pasó su límite |
| warning | `ahorro_bajo` | del ingreso del mes queda 6,7 %, menos del 10 % |
| warning | `presupuesto_por_agotarse` | Transporte va en 84 %, sobre el umbral de 80 % |
| warning | `meta_rezagada` | «Viaje de fin de año» va en 15 %, bajo el 25 % |
| info | `gastos_sin_categoria` | 220 000 sin categoría, el 26 % del gasto del mes |

## Por qué los montos son estos y no otros

No son al azar. Cada cifra está puesta para cruzar un umbral concreto del motor
de reglas (`backend/app/modules/ai/service.py`):

- El gasto del mes actual queda en 840 000 contra 900 000 de ingreso para que el
  ahorro caiga por debajo del 10 % y se dispare `ahorro_bajo`, sin llegar a
  negativo —que daría una recomendación más alarmante de la que conviene mostrar.
- Los gastos sin categoría suman el 26 % del mes porque esa regla exige 25 % o
  más.
- **Ninguna categoría llega al 50 % del gasto, a propósito.** El motor corta en
  cinco recomendaciones y ordena por severidad, dejando las `info` de últimas. Si
  además se disparara `categoria_dominante` —que exige justamente ese 50 %—
  serían seis, y la que quedaría fuera es `gastos_sin_categoria`, que es uno de
  los criterios de aceptación.

Si alguien cambia estos montos, conviene volver a correr el script: la
verificación del final avisa si algún criterio dejó de cumplirse.

## Antes de la demo

El plan gratuito de Render duerme el servicio a los 15 minutos. Abrir
`/health` un par de minutos antes de presentar para despertarlo.
