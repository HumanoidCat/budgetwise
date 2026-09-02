# Dailies — Sprint 1

Formato por persona: **Ayer / Hoy / Bloqueos**. Las dailies se hacen en el grupo del equipo antes de las 12:00 pm; aquí se registra quién participó y lo relevante.

## Lunes 31 de agosto

| Integrante | Participó | Resumen |
|---|---|---|
| Alejandro Zamora | Sí | Ayer: PR #30 auth (HU-01/02) mergeado con review de Luna; acta de planning. Hoy: HU-11 presupuestos (#18) y preparación del deploy en Render (#25). Bloqueos: ninguno. |
| Alejandro Luna | Sí (12:20 am del martes, fuera de hora) | Ayer: montó el entorno backend y completó HU-03 (CRUD de categorías: módulo completo, 9 categorías por defecto al registrarse, borrado protegido, 25 pruebas nuevas; 47 en verde, ruff limpio, 99% cobertura). Hoy: abre el PR de HU-03 (#10) y arranca HU-08. Bloqueos: HU-09 esperaba S0-6/HU-04/HU-05 de César — ya mergeados, desbloqueado. |
| César Ubau | Sí (1:08 pm, fuera de hora) | Ayer: clonó el repo. Hoy: leyó docs y revisó sus tareas; trabajando en S0-6 modelo de datos + migraciones Alembic. Bloqueos: ninguno. |
| Avril Madrigal | Sí (12:02 pm) | Ayer: clonó el repo. Hoy: leyó onboarding, revisó S0-4 y S0-7; avanzando con los wireframes de las 6 pantallas. Bloqueos: ninguno. |

Bloqueos abiertos:
- Ninguno reportado.

Notas: César y Avril confirmaron lo solicitado en la planning (repo clonado, guía leída, tareas identificadas). César además entregó 3 PRs (HU-04, HU-05, S0-6) revisados y mergeados el mismo día. Luna asistió a la planning, revisó PRs y completó HU-03 en local; su daily llegó a las 12:20 am del martes.

## Martes 1 de septiembre

| Integrante | Participó | Resumen |
|---|---|---|
| Alejandro Zamora | Sí | Ayer: revisó y mergeó los 3 PRs de César, integró Alembic al arranque (#36), desplegó el backend en Render (HU-18 ✔) e implementó HU-16 observabilidad (Prometheus+Grafana, 68 pruebas). Hoy: PR de HU-16, resolver accesos al tablero y redefinir HU-09. Bloqueos: ninguno. |
| César Ubau | Sí (10:27 am) | Ayer: cerró HU-04, HU-05 y S0-6 (3 PRs mergeados), probó el flujo en Swagger. Hoy: arranca HU-10 (metas) y revisa el PR #38 de Avril. Bloqueos: espera HU-03 de Luna para el desglose por categoría. |
| Alejandro Luna | Sí (11:07 am) | Ayer: terminó HU-03 (CRUD categorías, 4 capas, 9 por defecto, borrado protegido, 25 pruebas, 99% cobertura); rama subida. Hoy: rebase sobre main + PR de HU-03 (#10), luego HU-08. Bloqueos: ninguno; pide redefinir el alcance de HU-09 (la cobertura ya está en 99%). |
| Avril Madrigal | Sí (11:56 am) | Ayer: diseño de las 6 pantallas (paleta, tipografía). Hoy: cerró S0-7 (7 SVG en docs/wireframes, theme.ts, verificador de contraste), PR #38 abierto con rutas (auth)/(tabs) (S0-4), HU-06 corriendo de punta a punta en web; sigue con pruebas de pestañas y el PR de HU-06. Bloqueos: sin acceso al tablero (Projects) y sin Android para probar SecureStore/Expo Go (tiene iPhone). |

Bloqueos abiertos:
- Avril sin acceso al Project (lo resuelve Alejandro Z hoy: invitarla al Project con rol write).
- Avril sin dispositivo Android: la demo del 16 es con APK Android + web de respaldo; SecureStore se resuelve con un wrapper multiplataforma (decisión de PO abajo).

Decisiones del PO (martes):
- HU-09 se redefine (mismo esfuerzo, 3 pts): (1) umbral de cobertura en CI (pytest --cov-fail-under=80) para que la calidad no dependa de buena voluntad; (2) pruebas de integración ENTRE módulos que nadie cubre: registro → categorías por defecto → transacción → saldo → presupuesto → alerta; (3) casos límite cruzados (borrar categoría con presupuesto asociado, resumen con mes sin datos, etc.).
- HU-06: el criterio de sesión persistida se implementa con un wrapper de almacenamiento (SecureStore en nativo, localStorage en web) para poder desarrollarlo y probarlo en web; la verificación en Android se hace con el APK de la demo (C-1).
