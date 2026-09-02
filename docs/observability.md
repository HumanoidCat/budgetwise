# Observabilidad — BudgetWise (HU-16)

La rúbrica pide "monitoreo, trazabilidad, detección de fallos y seguimiento del comportamiento de la aplicación" (referencia: herramientas tipo Datadog). Implementamos las cuatro con herramientas abiertas y gratuitas, que corren junto al proyecto con `docker compose`.

## Qué hay

| Capacidad | Cómo se resuelve | Dónde verlo |
|---|---|---|
| **Monitoreo** | El API expone métricas Prometheus en `GET /metrics`: peticiones por endpoint y código de estado, histograma de latencia, peticiones en curso, excepciones y estado de la BD. Prometheus las raspa cada 5 s. | Grafana → dashboard **BudgetWise — API** (`http://localhost:3000`, admin/admin) |
| **Trazabilidad** | Cada petición recibe un `X-Request-ID` (se respeta si el cliente lo envía) que viaja en la respuesta y en todas las líneas de log de esa petición. Permite seguir una petición de la app hasta el error. | Cabecera de cualquier respuesta + logs del API |
| **Detección de fallos** | `GET /health` verifica la conexión real a PostgreSQL y devuelve **503** si falla (Render lo usa como health check). Las excepciones no controladas se registran con traza y request-id y devuelven un 500 uniforme. Prometheus evalúa 4 reglas de alerta: API caída, BD caída, tasa de 5xx > 5 %, latencia p95 > 1 s. | `http://localhost:9090/alerts` y paneles en rojo en Grafana |
| **Comportamiento** | Logs en JSON estructurado (una línea por evento con método, ruta, estado, duración y request-id), listos para filtrar en Render o ingerir en Datadog/Loki. | Logs del contenedor / pestaña Logs en Render |

Todo el código vive en `backend/app/core/observability.py`; la configuración en `observability/`.

## Levantarlo en local

```bash
docker compose up --build
```

- API: http://localhost:8001/docs · métricas crudas: http://localhost:8001/metrics
- Prometheus: http://localhost:9090 (Status → Targets debe mostrar `budgetwise-api` en UP; Alerts muestra las 4 reglas)
- Grafana: http://localhost:3000 (usuario `admin`, contraseña `admin`) → Dashboards → BudgetWise → **BudgetWise — API**

El dashboard se aprovisiona solo (no hay que importar nada). Para verlo con datos, generá tráfico desde Swagger o la app; para verlo detectar un fallo, pará la base (`docker compose stop db`): `/health` pasa a 503, el panel "Base de datos" se pone rojo y en ~30 s se dispara la alerta `BaseDeDatosCaida`.

## En Render (producción de la demo)

En Render solo corre el API. Ahí la observabilidad se ve en: **Logs** (líneas JSON con request-id), **Metrics** de la plataforma (CPU/memoria/latencia), y el health check automático contra `/health` (si la BD cae, Render marca el servicio como unhealthy). Prometheus/Grafana se muestran en la demo desde el entorno local con `docker compose`.

## Guion para la presentación (30 segundos)

1. Abrir Grafana con el dashboard en vivo mientras alguien usa la app → "esto es monitoreo".
2. Mostrar una respuesta con `X-Request-ID` y buscar ese id en los logs → "esto es trazabilidad".
3. `docker compose stop db` → el panel se pone rojo y `/health` responde 503 → "esto es detección de fallos".
4. `docker compose start db` → todo vuelve a verde.

## Por qué no Datadog

Datadog es de pago y requiere agente e ingestión externa; Prometheus + Grafana cubren los mismos conceptos (métricas, dashboards, alertas) sin costo y corren dentro del mismo `docker compose` del proyecto, lo que además refuerza el criterio de contenerización. Si el proyecto creciera, el mismo `/metrics` se conecta al agente de Datadog sin tocar el código.
