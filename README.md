# BudgetWise

MVP de gestión de presupuesto personal — Ingeniería de Software II, Universidad Invenio.

**Equipo:** Alejandro Zamora (PM/dev) · César Ubau (dev) · Alejandro Luna (dev) · Avril Madrigal (frontend)

## Estructura del monorepo

```
budgetwise/
├── backend/    # API FastAPI (Python) — monolito modular con capas
├── mobile/     # App React Native (Expo) — también exporta a web
├── k8s/        # Manifiestos Kubernetes (exploración con k3d/minikube)
├── observability/  # Prometheus, alertas y dashboard de Grafana (HU-16)
├── docs/       # Arquitectura y evidencia Scrum
└── .github/    # CI (GitHub Actions) y plantilla de PR
```

## Arquitectura

Monolito modular con principios de Clean Architecture. Cada módulo de dominio
(`auth`, `categories`, `transactions`, `goals`, `budgets`, `ai`) tiene sus capas:
`router` (HTTP) → `service` (casos de uso) → `repository` (persistencia).
Justificación: el tamaño del equipo y del MVP no amerita microservicios; el
monolito modular da claridad y mantenibilidad, y cada módulo puede extraerse
a futuro. Detalle en [docs/architecture.md](docs/architecture.md).

## Levantar el backend (Docker)

```bash
cd backend
cp .env.example .env
docker compose up --build
# API en http://localhost:8001 — docs interactivas en http://localhost:8001/docs
# (puertos del host: API 8001, Postgres 5433; se cambian en .env, ver .env.example)
```

Sin Docker: `pip install -r requirements.txt` y `uvicorn app.main:app --reload --port 8001` (requiere PostgreSQL local o SQLite vía .env).

## Levantar la app móvil

```bash
cd mobile
npm install
npx expo start   # escanear el QR con Expo Go en el celular
```

Para que el celular alcance el API local, poner en `mobile/.env` la IP de tu
máquina en la red WiFi: `EXPO_PUBLIC_API_URL=http://192.168.x.x:8001`.

## Observabilidad

`docker compose up` levanta también Prometheus (http://localhost:9090) y Grafana
(http://localhost:3000, admin/admin) con un dashboard del API ya aprovisionado.
API en http://localhost:8001. Métricas en `/metrics`, health con chequeo de BD en `/health`, logs JSON con
`X-Request-ID`. Detalle y guion de demo en [docs/observability.md](docs/observability.md).

## Pruebas

```bash
cd backend && pytest          # unitarias backend
cd mobile && npm test         # unitarias frontend
```

## Flujo de trabajo (Scrum)

- Tablero y backlog: GitHub Projects. Milestones = sprints.
- Rama por historia: `feature/HU-XX-descripcion-corta`.
- Merge a `main` solo por PR con al menos 1 revisión. CI debe pasar.
- Evidencia de ceremonias en `docs/scrum/`.
