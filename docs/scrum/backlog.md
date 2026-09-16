# Product Backlog — BudgetWise

Repo: [HumanoidCat/budgetwise](https://github.com/HumanoidCat/budgetwise) · Entrega: 16 de setiembre de 2026

Estado al 16 de setiembre. Cada fila enlaza a su issue: el tablero de GitHub es
la fuente de verdad, este documento es la vista de conjunto.

**Equipo**

| Sigla | Integrante | Usuario de GitHub | Rol |
|---|---|---|---|
| AZ | Alejandro Zamora | `HumanoidCat` | PM / PO / Scrum Master + backend |
| AM | Avril Madrigal | `avmgal1414` | Frontend |
| CU | César Ubau | `cesarubau-droid` | Backend |
| AL | Alejandro Luna | `luna0809-oss` | Backend + calidad |

Estimación en puntos: 1 ≈ 1-2 h · 2 ≈ medio día · 3 ≈ 1 día · 5 ≈ 2-3 días.

---

## Resumen

| | Issues | Puntos | Estado |
|---|---|---|---|
| Sprint 0 — Setup | 7 | 14 | Cerrado |
| Sprint 1 — Flujo core | 9 | 33 | Cerrado |
| Sprint 2 — MVP completo | 9 | 39 | 8 de 9 cerradas |
| Cierre | 4 | 10 | 3 de 4 cerradas |
| **Fuera del plan original** | **12** | **26** | **Cerradas** |
| **Total** | **41** | **122** | **39 cerradas · 2 abiertas** |

**Velocidad del Sprint 1: 37 de 37 puntos comprometidos, 11 de 11 historias.
Sprint cerrado sin arrastre.** (El compromiso del Sprint 1 incluyó S0-6 y S0-7,
que venían del Sprint 0, por eso son 37 y no 33.)

Las dos abiertas: [#22](https://github.com/HumanoidCat/budgetwise/issues/22)
está entregada y espera merge en el
[PR #73](https://github.com/HumanoidCat/budgetwise/pull/73);
[#27](https://github.com/HumanoidCat/budgetwise/issues/27) son las filminas, en
curso el día de la entrega.

---

## Sprint 0 — Setup (29–31 ago)
**Meta:** repo listo para desarrollar.

| Issue | Historia / Tarea | Asignado | Pts | Estado |
|---|---|---|---|---|
| [#1](https://github.com/HumanoidCat/budgetwise/issues/1) | S0-1 Configurar repo: protección de `main`, colaboradores, plantilla de PR | AZ | 1 | Cerrada |
| [#2](https://github.com/HumanoidCat/budgetwise/issues/2) | S0-2 Crear GitHub Project, tablero y campo Sprint | AZ | 1 | Cerrada |
| [#3](https://github.com/HumanoidCat/budgetwise/issues/3) | S0-3 Esqueleto backend FastAPI + docker-compose con PostgreSQL | AZ | 3 | Cerrada |
| [#4](https://github.com/HumanoidCat/budgetwise/issues/4) | S0-4 Esqueleto app Expo con Expo Router y pantallas placeholder | AM | 3 | Cerrada |
| [#5](https://github.com/HumanoidCat/budgetwise/issues/5) | S0-5 CI con GitHub Actions: lint + pruebas en cada PR | AZ | 2 | Cerrada |
| [#6](https://github.com/HumanoidCat/budgetwise/issues/6) | S0-6 Modelo de datos inicial + migraciones Alembic | CU | 2 | Cerrada |
| [#7](https://github.com/HumanoidCat/budgetwise/issues/7) | S0-7 Wireframes de las 6 pantallas principales | AM | 2 | Cerrada |

S0-6 y S0-7 no alcanzaron a cerrarse en la ventana del Sprint 0 y entraron al
compromiso del Sprint 1.

---

## Sprint 1 (31 ago – 6 sep)
**Meta:** que el flujo core funcione de punta a punta — registro, transacción, saldo.

| Issue | Historia | Asignado | Pts | Estado |
|---|---|---|---|---|
| [#8](https://github.com/HumanoidCat/budgetwise/issues/8) | HU-01 Registro de usuario (API) | AZ | 3 | Cerrada |
| [#9](https://github.com/HumanoidCat/budgetwise/issues/9) | HU-02 Login con JWT (API) | AZ | 3 | Cerrada |
| [#10](https://github.com/HumanoidCat/budgetwise/issues/10) | HU-03 CRUD de categorías (API) | AL | 3 | Cerrada |
| [#11](https://github.com/HumanoidCat/budgetwise/issues/11) | HU-04 CRUD de ingresos y gastos (API) | CU | 5 | Cerrada |
| [#12](https://github.com/HumanoidCat/budgetwise/issues/12) | HU-05 Cálculo automático de saldo y resumen (API) | CU | 3 | Cerrada |
| [#13](https://github.com/HumanoidCat/budgetwise/issues/13) | HU-06 Pantallas de registro y login en la app | AM | 5 | Cerrada |
| [#14](https://github.com/HumanoidCat/budgetwise/issues/14) | HU-07 Pantalla de transacciones (lista + alta/edición) | AM | 5 | Cerrada |
| [#15](https://github.com/HumanoidCat/budgetwise/issues/15) | HU-08 Pantalla de categorías en la app | AL | 3 | Cerrada |
| [#16](https://github.com/HumanoidCat/budgetwise/issues/16) | HU-09 Pruebas de integración entre módulos + umbral de cobertura en CI | AL | 3 | Cerrada |

HU-09 se redefinió a mitad del sprint —de pruebas unitarias a pruebas de
integración más umbral de cobertura en CI— y aun así entró el último día.

---

## Sprint 2 (7–13 sep)
**Meta:** MVP completo con IA, alertas, pruebas y observabilidad.

| Issue | Historia | Asignado | Pts | Estado |
|---|---|---|---|---|
| [#17](https://github.com/HumanoidCat/budgetwise/issues/17) | HU-10 Metas de ahorro (API + pantalla) | CU | 5 | Cerrada |
| [#18](https://github.com/HumanoidCat/budgetwise/issues/18) | HU-11 Presupuesto mensual y detección de sobrepaso (API) | AZ | 5 | Cerrada |
| [#19](https://github.com/HumanoidCat/budgetwise/issues/19) | HU-12 Alertas de presupuesto en la app | AL | 3 | Cerrada |
| [#20](https://github.com/HumanoidCat/budgetwise/issues/20) | HU-13 Dashboard financiero con gráficos | AM | 5 | Cerrada |
| [#21](https://github.com/HumanoidCat/budgetwise/issues/21) | HU-14 Módulo de IA: recomendaciones financieras | AZ | 5 | Cerrada |
| [#22](https://github.com/HumanoidCat/budgetwise/issues/22) | HU-15 Pruebas E2E del flujo core | AZ (antes CU) | 5 | **En PR #73** |
| [#23](https://github.com/HumanoidCat/budgetwise/issues/23) | HU-16 Observabilidad: logs estructurados, /health, Prometheus + Grafana | AZ | 5 | Cerrada |
| [#24](https://github.com/HumanoidCat/budgetwise/issues/24) | HU-17 Manifiestos Kubernetes probados en k3d/minikube | AZ | 3 | Cerrada |
| [#25](https://github.com/HumanoidCat/budgetwise/issues/25) | HU-18 Deploy del backend para la demo (Render/Railway) | AZ | 3 | Cerrada |

**HU-15 se reasignó al reajustar la carga del sprint** y la cerró el PM antes de
la entrega. Es la única historia del Sprint 2 que llegó al día final, y por eso
está registrada aparte: el resto entró dentro de su ventana.

---

## Cierre (14–16 sep)
**Meta:** demo ensayada y presentación lista.

| Issue | Tarea | Asignado | Pts | Estado |
|---|---|---|---|---|
| [#26](https://github.com/HumanoidCat/budgetwise/issues/26) | C-1 Generar APK con EAS Build e instalar en celulares | AM + AZ | 3 | Cerrada |
| [#27](https://github.com/HumanoidCat/budgetwise/issues/27) | C-2 Filminas de la presentación (máx. 5) | AZ | 2 | **Abierta** |
| [#28](https://github.com/HumanoidCat/budgetwise/issues/28) | C-3 Ensayo de demo en vivo con guion | AZ | 2 | Cerrada |
| [#29](https://github.com/HumanoidCat/budgetwise/issues/29) | C-4 Hardening final: bugs, estados vacíos, mensajes de error | AZ | 3 | Cerrada |

---

## Fuera del plan original

Trabajo que no estaba en el backlog de agosto. Aparece aquí porque existe, se
entregó y cuenta: un backlog que solo muestra lo planificado esconde la mitad
de lo que pasó en el proyecto.

### Descubierto durante el desarrollo

| Issue | Historia | Asignado | Pts | Por qué apareció |
|---|---|---|---|---|
| [#41](https://github.com/HumanoidCat/budgetwise/issues/41) | HU-10b Pantalla de metas de ahorro | CU | 3 | HU-10 entregó la API; faltaba la pantalla |
| [#42](https://github.com/HumanoidCat/budgetwise/issues/42) | HU-19 Endpoint de evolución mensual `GET /transactions/monthly` | CU | 2 | El gráfico del dashboard (HU-13) necesitaba datos que ningún endpoint daba |
| [#49](https://github.com/HumanoidCat/budgetwise/issues/49) | C-5 Datos de demo: script de semilla | CU | 2 | Con una cuenta vacía, la IA, las alertas y los gráficos no muestran nada |

### Bugs encontrados y corregidos

| Issue | Bug | Asignado | Pts |
|---|---|---|---|
| [#52](https://github.com/HumanoidCat/budgetwise/issues/52) | El contenido no se centra en pantalla ancha (login, registro, dashboard) | AM | 1 |
| [#53](https://github.com/HumanoidCat/budgetwise/issues/53) | El error de correo inválido se muestra en inglés y con jerga técnica | AM | 1 |
| [#54](https://github.com/HumanoidCat/budgetwise/issues/54) | Tocar una categoría no abre el formulario de edición | AZ | 1 |

### Alcance nuevo del 16 de setiembre

| Issue | Historia | Asignado | Pts | Qué resolvió |
|---|---|---|---|---|
| [#69](https://github.com/HumanoidCat/budgetwise/issues/69) | S2-1 Identidad visual v2: logotipo en la app, ícono y paleta derivada del logo | AZ | 5 | La app mostraba una marca genérica y el ícono de la plantilla de Expo |
| [#70](https://github.com/HumanoidCat/budgetwise/issues/70) | HU-11b Pantalla de presupuestos | AZ | 3 | HU-11 se dio por terminada con solo la API; sin pantalla, el titular del dashboard no lo veía nadie |
| [#71](https://github.com/HumanoidCat/budgetwise/issues/71) | HU-14b Asesor conversacional anclado a los datos del usuario | AZ | 5 | HU-14 sugiere sin que le pregunten; el asesor contesta lo que la persona escribió |
| [#72](https://github.com/HumanoidCat/budgetwise/issues/72) | C-6 EAS Update (OTA) y cifras tabulares en todas las pantallas | AZ | 3 | Cada arreglo costaba un build de 20 minutos; y el sistema tipográfico solo se aplicaba en 2 pantallas de 14 |

---

## Definition of Done

Una historia está terminada cuando:

1. El código está en una rama propia, mergeada a `main` por PR **revisado por
   otra persona**.
2. Las pruebas de lo nuevo pasan en CI, y la cobertura no baja del 80 % —el
   umbral rompe el build, no es una recomendación.
3. No hay errores de lint.
4. **Se puede enseñar en la app**, no basta con que el endpoint responda.

El punto 4 es el acuerdo 3 del planning del Sprint 2, y lo escribimos después
de incumplirlo: HU-11 se cerró con solo la API y nadie notó que faltaba la
pantalla hasta que se fue a construir el dashboard. Ahí se corrigió con
[#70](https://github.com/HumanoidCat/budgetwise/issues/70) y quedó la regla.

## Evidencia de Scrum

| Qué | Dónde |
|---|---|
| Tablero con issues como historias de usuario | GitHub Projects |
| Planning de cada sprint | `docs/scrum/sprint-1-planning.md`, `sprint-2-planning.md` |
| Review y retrospectiva | `docs/scrum/sprint-1-review-retro.md` |
| Dailies asincrónicas | `docs/scrum/dailies.md` |
| Este backlog | `docs/scrum/backlog.md` |

**Lo que el seguimiento detectó a tiempo**, que es para lo que sirve:

- Una historia cerrada con la API lista pero sin pantalla
  ([#70](https://github.com/HumanoidCat/budgetwise/issues/70)). De ahí salió el
  punto 4 de la Definition of Done.
- Un gráfico del dashboard que pedía datos que ningún endpoint devolvía
  ([#42](https://github.com/HumanoidCat/budgetwise/issues/42)).
- Una cuenta de demo vacía, con la que la IA, las alertas y los gráficos no
  muestran nada ([#49](https://github.com/HumanoidCat/budgetwise/issues/49)).
- El primer APK construido apuntando a `localhost`: el `.env` local no viaja al
  build de EAS, y la URL tuvo que moverse a `eas.json`.
- Tres bugs de interfaz encontrados y corregidos antes de la entrega
  ([#52](https://github.com/HumanoidCat/budgetwise/issues/52),
  [#53](https://github.com/HumanoidCat/budgetwise/issues/53),
  [#54](https://github.com/HumanoidCat/budgetwise/issues/54)).

Ninguno de estos se encontró leyendo código: salieron de construir la pantalla
siguiente, de armar los datos de demo y de instalar el APK en un teléfono real.
