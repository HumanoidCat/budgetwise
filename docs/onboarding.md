# Guía de arranque — Equipo BudgetWise

Bienvenidos. Este es el proyecto del curso Ingeniería de Software II (entrega: **16 de septiembre**). Lean esto completo antes de tocar código (10 min).

## 1. Qué vamos a construir

Un MVP de presupuesto personal: app móvil (React Native/Expo) + API (FastAPI/Python) + PostgreSQL. Funcionalidades: registro/login, ingresos y gastos, categorías, saldo, dashboard, metas de ahorro, alertas de presupuesto y recomendaciones con IA.

## 2. Roles

- **Alejandro Zamora** — PM (PO/Scrum Master) + backend core, DevOps, IA
- **César Ubau** — backend (transacciones, saldo, metas)
- **Alejandro Luna** — backend/frontend (categorías, alertas) + pruebas (unitarias y E2E)
- **Avril Madrigal** — frontend (pantallas, dashboard, APK)

Cada quien tiene sus issues asignados en GitHub con criterios de aceptación. El tablero: pestaña **Projects** del repo.

## 3. Instalar (una sola vez)

- Git y una cuenta GitHub con la invitación al repo aceptada
- Python 3.12+ (backend)
- Node.js 22 LTS (frontend)
- **Expo Go** en su celular (App Store / Play Store) — así prueban la app sin compilar nada
- Docker Desktop (opcional pero recomendado para el backend)

## 4. Levantar el proyecto

```bash
git clone https://github.com/HumanoidCat/budgetwise.git
cd budgetwise
```

**Backend** (opción Docker, la fácil):
```bash
cd backend && cp .env.example .env && cd ..
docker compose up --build
# API: http://localhost:8001 — probar en http://localhost:8001/docs
# (usamos 8001 y 5433 en el host para no chocar con geoguardian)
```

**Backend** (sin Docker):
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env    # y cambiar DATABASE_URL a sqlite:///./budgetwise.db
uvicorn app.main:app --reload --port 8001
```

**App móvil:**
```bash
cd mobile
npm install
copy .env.example .env    # poner la IP de SU máquina en la red WiFi (puerto 8001)
npx expo start            # escanear el QR con Expo Go
```

## 5. Cómo trabajamos (¡importante!)

1. Tomá tu issue en el tablero y movelo a **In Progress**.
2. Creá una rama desde `main`: `git checkout -b feature/HU-XX-descripcion`
3. Commits pequeños y claros. Incluí pruebas de lo que hagás.
4. Push y **Pull Request** a `main` usando la plantilla. En la descripción: `Closes #<issue>`.
5. Otra persona del equipo revisa y aprueba. **Nadie mergea su propio PR sin review.**
6. El CI (pestaña Actions) tiene que estar en verde para mergear.
7. Al mergear, el issue se cierra y cae en **Done** solo.

**No** se pushea directo a `main` (está protegido). **No** hay rama `dev`: feature → main.

## 6. Verificar antes de pedir review

```bash
# Backend
cd backend && ruff check app tests && pytest

# Frontend
cd mobile && npm run lint
```

## 7. Comunicación

- Daily asincrónica en el grupo (WhatsApp/Discord): qué hice ayer, qué haré hoy, qué me bloquea. Cortito.
- Bloqueado más de 1 hora con algo → avisá, no te quedés trabado.
- Dudas de alcance o criterios de un issue → preguntarle a Alejandro Z (PO).

## 8. Fechas

| Sprint | Fechas | Meta |
|---|---|---|
| Sprint 1 | 31 ago – 6 sep | Flujo core: registro → transacción → saldo, en app |
| Sprint 2 | 7 – 13 sep | Metas, alertas, IA, dashboard, E2E, observabilidad |
| Cierre | 14 – 16 sep | APK, ensayo de demo, filminas, presentación |
