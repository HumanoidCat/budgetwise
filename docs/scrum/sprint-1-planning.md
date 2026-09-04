# Sprint 1 — Planning

**Fecha:** domingo 30 de agosto de 2026, 8:00 pm (Costa Rica)
**Modalidad:** llamada convocada al grupo del equipo el sábado 29 de agosto, con recordatorio el mismo domingo. Ante la inasistencia de dos integrantes, se realizó entre los presentes y se envió resumen asincrónico al grupo.
**Duración del sprint:** lunes 31 de agosto – sábado 5 de septiembre de 2026

## Asistencia

| Integrante | Rol | Asistencia |
|---|---|---|
| Alejandro Zamora | PM / PO / Scrum Master + backend | Presente |
| Alejandro Luna | Backend + calidad | Presente |
| César Ubau | Backend | **Ausente, sin aviso previo** |
| Avril Madrigal | Frontend | **Ausente, sin aviso previo** |

## Objetivo del sprint

Que el flujo principal funcione de punta a punta: un usuario se registra, inicia sesión, registra un ingreso o gasto con categoría y ve su saldo actualizado en la app móvil.

## Historias comprometidas

| Issue | Historia | Responsable | Pts |
|---|---|---|---|
| #8 | HU-01 Registro de usuario (API) | Alejandro Zamora | 3 |
| #9 | HU-02 Login con JWT (API) | Alejandro Zamora | 3 |
| #10 | HU-03 CRUD de categorías (API) | Alejandro Luna | 3 |
| #15 | HU-08 Pantalla de categorías en la app | Alejandro Luna | 3 |
| #16 | HU-09 Pruebas unitarias del core backend | Alejandro Luna | 3 |
| #6 | S0-6 Modelo de datos + migraciones Alembic | César Ubau | 2 |
| #11 | HU-04 CRUD de ingresos y gastos (API) | César Ubau | 5 |
| #12 | HU-05 Cálculo de saldo y resumen (API) | César Ubau | 3 |
| #7 | S0-7 Wireframes de las 6 pantallas | Avril Madrigal | 2 |
| #13 | HU-06 Pantallas de registro y login | Avril Madrigal | 5 |
| #14 | HU-07 Pantalla de transacciones | Avril Madrigal | 5 |

Total comprometido: 37 pts.

## Estado al inicio del sprint

- Sprint 0 completado por Alejandro Zamora: repositorio, esqueleto del monorepo (FastAPI + Expo + Docker + CI), tablero de GitHub Projects, backlog completo (29 issues), guía de arranque (`docs/onboarding.md`) y prompts de trabajo para cada integrante.
- HU-01 y HU-02 ya implementadas con pruebas, en rama `feature/HU-01-02-auth`, pendientes de PR y revisión.
- Los tres integrantes aceptaron la invitación al repositorio el 30 de agosto.

## Acuerdos

1. Flujo de trabajo: rama `feature/HU-XX-...` → Pull Request a `main` con revisión de otra persona y CI en verde. No se hace push directo a `main`.
2. Daily asincrónica en el grupo, todos los días antes de las 12:00 pm, formato: ayer / hoy / bloqueos.
3. Bloqueos de más de una hora se comunican de inmediato, no se espera a la daily.
4. Alejandro Luna revisará el PR de autenticación (#8/#9) como primer contacto con el código y para desbloquear al resto de módulos.
5. Review + retrospectiva del Sprint 1: sábado 5 de septiembre, 8:00 pm.

## Acciones derivadas de la inasistencia

- Se envió al grupo el resumen completo de la planning (objetivo, historias, acuerdos) la misma noche.
- Se solicitó a César Ubau y Avril Madrigal confirmar antes del lunes 31 de agosto a las 12:00 pm que clonaron el repo, leyeron la guía y conocen sus tareas.
- Se deja constancia de la inasistencia en este documento como parte del seguimiento del equipo.
