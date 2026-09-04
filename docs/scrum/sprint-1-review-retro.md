# Sprint 1 — Review y Retrospectiva

**Fecha:** sábado 5 de septiembre de 2026, 8:00 pm (Costa Rica)
**Duración del sprint:** lunes 31 de agosto – sábado 5 de septiembre de 2026
**Modalidad:** llamada del equipo. Facilita: Alejandro Zamora (Scrum Master).

## Asistencia

| Integrante | Asistencia |
|---|---|
| Alejandro Zamora | |
| Alejandro Luna | |
| César Ubau | |
| Avril Madrigal | |

---

# Parte 1 — Review

## Objetivo del sprint

> Que el flujo principal funcione de punta a punta: un usuario se registra, inicia sesión, registra un ingreso o gasto con categoría y ve su saldo actualizado en la app móvil.

**Resultado: cumplido parcialmente.** Registro, inicio de sesión, alta de movimiento con categoría y listado funcionan en la app. Lo que falta es el último eslabón: **el saldo no se ve en la app**. El API lo calcula (`GET /transactions/summary`) y está probado, pero la pantalla de Inicio sigue siendo un placeholder porque el dashboard (HU-13) quedó en el Sprint 2. Es la brecha más importante del sprint y la primera prioridad del siguiente.

## Historias comprometidas

| Issue | Historia | Responsable | Pts | Estado |
|---|---|---|---|---|
| #8 | HU-01 Registro de usuario (API) | Alejandro Zamora | 3 | Terminada |
| #9 | HU-02 Login con JWT (API) | Alejandro Zamora | 3 | Terminada |
| #10 | HU-03 CRUD de categorías (API) | Alejandro Luna | 3 | Terminada |
| #15 | HU-08 Pantalla de categorías en la app | Alejandro Luna | 3 | Terminada |
| #16 | HU-09 Pruebas de integración + umbral de cobertura | Alejandro Luna | 3 | **No terminada** |
| #6 | S0-6 Modelo de datos + migraciones Alembic | César Ubau | 2 | Terminada |
| #11 | HU-04 CRUD de ingresos y gastos (API) | César Ubau | 5 | Terminada |
| #12 | HU-05 Cálculo de saldo y resumen (API) | César Ubau | 3 | Terminada |
| #7 | S0-7 Wireframes de las 6 pantallas | Avril Madrigal | 2 | Terminada |
| #13 | HU-06 Pantallas de registro y login | Avril Madrigal | 5 | Terminada |
| #14 | HU-07 Pantalla de transacciones | Avril Madrigal | 5 | Terminada |

**Velocidad: 34 de 37 puntos (10 de 11 historias).** Único arrastre: HU-09 (#16), 3 pts, que además fue redefinida a mitad de sprint.

## Entregado fuera de lo comprometido

Trabajo del Sprint 2 adelantado dentro de este sprint:

| Historia | Responsable |
|---|---|
| HU-11 Presupuestos por categoría con alertas (API) | Alejandro Zamora |
| HU-14 Recomendaciones con IA (API) | Alejandro Zamora |
| HU-16 Observabilidad: métricas, health, logs, Grafana | Alejandro Zamora |
| HU-17 Exploración de Kubernetes con k3d | Alejandro Zamora |
| HU-18 Despliegue del API en Render | Alejandro Zamora |
| HU-10 Metas de ahorro (API) | César Ubau |
| HU-19 Evolución mensual (API) | César Ubau |

Con esto **el backend del MVP quedó completo** dentro del Sprint 1.

## Estado real del producto

Lo que hay que mirar no es el conteo de issues cerrados, sino qué se puede enseñar el 16:

- **Pantallas de la app: 3 de 6.** Hechas: registro/login, movimientos, categorías. Faltan: Inicio (dashboard), metas, alertas.
- **Backend: completo** y desplegado en Render, con observabilidad, migraciones y 123+ pruebas en verde.
- **Tareas de cierre: 0 de 5.** APK, filminas, ensayo, hardening y datos de demo no han arrancado.
- **Riesgo abierto:** la IA funciona en el API pero no se ve en la app. Sin la tarjeta de recomendaciones en el dashboard, la IA no cuenta como entregada.

## Demo de la review

1. Registro e inicio de sesión desde la app (cuenta nueva: se crean las 9 categorías por defecto).
2. Alta de un gasto con categoría y fecha; listado agrupado por día con filtro por tipo.
3. Administración de categorías desde Ajustes.
4. API en producción: `/docs`, `/health` con chequeo de base de datos, `/metrics`.
5. Recomendaciones de la IA respondiendo desde el API (todavía sin pantalla).

---

# Parte 2 — Retrospectiva

## Qué salió bien

- El backend completo una semana antes de lo planeado; el frontend nunca estuvo bloqueado por falta de API.
- Las revisiones de PR fueron técnicas de verdad, no aprobaciones de trámite: se detectaron el manejo del 204 en el borrado, el desfase de fechas por UTC y la inconsistencia de decimales antes de que llegaran a main.
- El equipo se autoorganizó: propuestas propias como dividir HU-10 en API y pantalla, o el endpoint de evolución mensual, salieron de los desarrolladores y no del PM.

## Qué no salió bien

- Las dailies arrancaron tarde y fuera de hora; solo un día llegaron los tres antes de las 12, y hubo un día con código entregado pero sin daily.
- Dos integrantes faltaron a la planning sin aviso, lo que retrasó el arranque de sus historias.
- Las ramas apiladas (una rama saliendo de otra sin mergear) causaron conflictos, un PR cerrado por GitHub y varias horas de rebase.
- El objetivo del sprint quedó a medias por una dependencia que no se vio al planificar: el saldo necesitaba el dashboard, y el dashboard quedó en el otro sprint.
- La carga quedó muy despareja: un integrante entregó nueve historias y otro arrastró la suya.

## Qué se cambia para el Sprint 2

1. **Dailies antes de las 12, sin excepción.** Entregar código no sustituye la daily: es la evidencia de Scrum que se califica.
2. **Nada de ramas apiladas.** Toda rama sale de `main` actualizado. Si una historia depende de otra, se espera el merge o se coordina antes de abrir el PR.
3. **El objetivo del sprint se revisa contra la app, no contra el API.** Una historia está terminada cuando se puede enseñar en pantalla.
4. **Reparto de reviews.** Nadie revisa tres PRs mientras otro no revisa ninguno; el PM asigna revisor al abrir el PR.
5. **Corte del miércoles.** El miércoles 9 se revisa el avance real; lo que esté en riesgo se recorta o se reasigna ahí, no el último día.

## Acuerdos y acciones

| Acción | Responsable | Fecha |
|---|---|---|
| | | |
