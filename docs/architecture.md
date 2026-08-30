# Arquitectura — BudgetWise

## Decisión

**Monolito modular con principios de Clean Architecture** (registro de decisión, 29/08/2026).

## Justificación (para la rúbrica y la presentación)

- Equipo de 4 personas y 18 días de plazo: un despliegue único minimiza fricción.
- Claridad: cada módulo de dominio es una carpeta autocontenida con sus capas.
- Mantenibilidad: la lógica de negocio (services) no depende de FastAPI ni de SQLAlchemy directamente; los repositories encapsulan la persistencia.
- Escalabilidad: cualquier módulo (p. ej. `ai`) puede extraerse a un servicio aparte sin reescribir el dominio — el monolito modular es el paso previo natural a microservicios.
- Alternativas descartadas: microservicios (sobre-ingeniería para un MVP), monolito sin módulos (se degrada rápido con 4 personas tocando el mismo código).

## Capas por módulo

```
HTTP (router.py)  →  Casos de uso (service.py)  →  Persistencia (repository.py)
                          ↓
                    Esquemas Pydantic (schemas.py) — contratos de entrada/salida
```

Módulos: `auth`, `categories`, `transactions`, `goals`, `budgets`, `ai`.
Transversales: `core/` (config, BD, seguridad) y `models/` (entidades SQLAlchemy).

## Diagrama general

```
[App móvil Expo/React Native] ──HTTP/JSON──> [FastAPI (monolito modular)] ──SQLAlchemy──> [PostgreSQL]
        │                                            │
   (export web: plan B demo)                  [Prometheus/Grafana]  (observabilidad)
```
