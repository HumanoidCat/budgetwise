# Deploy del backend en Render (HU-18)

El backend + PostgreSQL se despliegan en Render (plan gratuito) usando el Blueprint `render.yaml` de la raíz del repo. Objetivo: que la app móvil (Expo Go y el APK de la demo) tenga un API accesible por internet sin depender de la IP de una laptop.

## Pasos (una sola vez, ~5 minutos)

1. Entrar a https://render.com y crear cuenta con **GitHub** (Sign up with GitHub).
2. Dashboard → **New +** → **Blueprint**.
3. Conectar el repositorio `HumanoidCat/budgetwise` (autorizar acceso a Render si lo pide).
4. Render detecta `render.yaml` y muestra dos recursos: `budgetwise-api` (web service Docker) y `budgetwise-db` (PostgreSQL). Nombre del blueprint: `budgetwise`. Clic en **Apply**.
5. Esperar el primer build (3–5 min). Cuando `budgetwise-api` diga **Live**, la URL es algo como `https://budgetwise-api.onrender.com`.
6. Verificar: abrir `https://budgetwise-api.onrender.com/health` → `{"status":"ok"}` y `/docs` para el Swagger.

`SECRET_KEY` la genera Render automáticamente; `DATABASE_URL` la conecta sola a la base. No hay que configurar variables a mano.

## Después del deploy

- Anotar la URL del API en el grupo y en `mobile/.env.example` como valor para la demo (`EXPO_PUBLIC_API_URL`).
- Cada push a `main` redespliega automáticamente (`autoDeploy: true`), así que el API en la nube siempre refleja lo último mergeado.

## Limitaciones del plan gratuito (importante para la demo)

- El web service **se duerme tras 15 min sin tráfico** y tarda ~30–50 s en despertar. Antes de la presentación, abrir `/health` en el navegador un par de minutos antes para "calentarlo".
- La base de datos gratuita **expira a los 30 días** de creada — nos alcanza de sobra hasta el 16 de septiembre.
- El contenedor ejecuta `alembic upgrade head` antes de arrancar la API, así que el esquema de la BD siempre está al día con las migraciones de `backend/alembic/versions/`.

## Alternativa

Si Render diera problemas, Railway (https://railway.app) funciona igual con el mismo Dockerfile: New Project → Deploy from GitHub → root directory `backend` → agregar plugin PostgreSQL → variable `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`.
