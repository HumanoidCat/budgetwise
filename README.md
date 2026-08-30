# BudgetWise

MVP de gestión de presupuesto personal — Ingeniería de Software II, Universidad Invenio.

**Equipo:** Alejandro Zamora (PM/dev) · César Ubau (dev) · Alejandro Luna (dev) · Avril Madrigal (frontend)

## Estructura del monorepo

```
budgetwise/
├── backend/    # API FastAPI (Python) — monolito modular con capas
├── mobile/     # App React Native (Expo) — también exporta a web
├── k8s/        # Manifiestos Kubernetes (exploración con minikube)
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
# API en http://localhost:8000 — docs interactivas en http://localhost:8000/docs
```

Sin Docker: `pip install -r requirements.txt` y `uvicorn app.main:app --reload` (requiere PostgreSQL local o SQLite vía .env).

## Levantar la app móvil

```bash
cd mobile
npm install
npx expo start   # escanear el QR con Expo Go en el celular
```

Para que el celular alcance el API local, poner en `mobile/.env` la IP de tu
máquina en la red WiFi: `EXPO_PUBLIC_API_URL=http://192.168.x.x:8000`.

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
