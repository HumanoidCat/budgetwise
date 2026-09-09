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

## Miércoles 2 de septiembre

| Integrante | Participó | Resumen |
|---|---|---|
| Alejandro Luna | Sí (10:03 am) | Ayer: PR #44 de HU-03 abierto, revisado por César y mergeado; CI verde, 123 pruebas, 97% de cobertura; issue #10 cerrado — categories deja de ser el último módulo en placeholder. Hoy: HU-08 (#15), pantalla de categorías con los wireframes de S0-7. Bloqueos: ninguno. |
| César Ubau | Sí (10:35 am) | Ayer: aprobó #38 (wireframes) y #44 (categorías); HU-10 (API de metas) mergeada en #39; HU-19 (evolución mensual) entregada en #45 con CI verde. Hoy: revisó y aprobó #47 (pantalla de transacciones) y entregó HU-10b (pantalla de metas) en #48. Sin backlog propio pendiente. Bloqueos: #45 y #48 esperan review; #48 no corre CI por apuntar a la rama de Avril; espera decisión sobre los decimales (#47). |
| Avril Madrigal | Sí (11:57 am) | Ayer: cerró S0-7 (#38 mergeado) y dejó listas S0-4 y HU-06. Hoy: PR #46 con S0-4 + HU-06 juntas (el login exigía la reorganización (auth)/(tabs)), CI verde, wrapper de storage en src/lib/storage.ts; terminó HU-07 (lista con filtro y agrupación por día, paginación, 4 estados, alta/edición con borrado confirmado, probada de punta a punta en web contra el API desplegado); sigue con el PR de HU-07, capturas de evidencia y HU-13. Bloqueos: ninguno. |
| Alejandro Zamora | Sí | Ayer: mergeó HU-14 (#43) — backend del MVP completo, las 9 historias propias entregadas; limpieza de ramas. Hoy: review de #45 y #46, decisiones de decimales y lockfile, registro del acta. Bloqueos: ninguno. |

Los tres dailies llegaron antes de las 12:00 por primera vez en el sprint.

Bloqueos abiertos:
- #45 y #48 sin review asignada (resuelto abajo: AZ toma #45 y #46, Luna toma #48).
- #48 sin CI: el workflow solo dispara contra main. Se resuelve con el orden de merges.

Decisiones del PO (miércoles):
- Decimales (#47): la corrección va en la app, no en el API. `conMiles()` en src/lib/formato.ts muestra dos decimales con coma cuando el monto tiene céntimos ("4 200,50") y entero cuando no; el API se queda con Numeric(12,2) tal como está. Lo integra Avril en el mismo #47 al rebasar.
- mobile/package-lock.json SÍ se versiona (hoy el CI instala versiones potencialmente distintas a las locales); el job mobile pasa de `npm install` a `npm ci`. Va en el #47.
- Orden de merges: #46 (squash) → #45 (update-branch + squash) → #47 (rebase sobre main + squash) → #48 (re-apuntar base a main + rebase + squash).
- Evidencia S0-7 en el tablero: la captura se toma tal como está y la evidencia lleva una nota de que el Project fue privado hasta el 1/9, por lo que la tarjeta pasó directo a Done con el merge. No se recrea el paso por In Progress.
- Nota para la demo: las cuentas creadas antes del merge de HU-03 no tienen categorías por defecto (se crean al registrarse). La demo del 16 usa una cuenta nueva o los datos de semilla.
- César, sin backlog propio: toma la preparación de datos de demo (script de semilla con cuenta demo, ~3 meses de movimientos, presupuestos y metas) — sirve para la demo del 16 y para probar el gráfico de HU-19 con datos reales.

## Jueves 3 de septiembre

| Integrante | Participó | Resumen |
|---|---|---|
| Alejandro Luna | Sí (10:56 am) | Ayer: sin avance, día ocupado fuera del proyecto. Hoy: arranca HU-08 (#15), pantalla de categorías. Bloqueos: ninguno. |
| César Ubau | Sí (10:58 am) | Ayer: revisó y aprobó #47 y entregó HU-10b en #48; se mergeó #45 (HU-19). Hoy: arranca C-5 (#49, datos de demo); apenas se mergee #47, reapunta #48 a main y dispara el CI. Bloqueos: #48 espera review y no tiene checks hasta que #47 esté en main. |
| Avril Madrigal | NO envió daily | Sí trabajó: empujó a la rama de HU-07 el rebase sobre main y los tres acuerdos del miércoles (fix de decimales en conMiles con redondeo previo a 2 decimales, package-lock.json versionado, npm ci en el CI) a las 10:49 am. El daily no llegó. |
| Alejandro Zamora | Sí | Ayer: mergeó #45 y #46, acta del miércoles, respondió la consulta de decimales en el #47, detalló el #49. Hoy: verificación del push de Avril en el #47 (los tres acuerdos cumplidos), review y merge de #47, registro del acta. Bloqueos: ninguno. |

Bloqueos abiertos:
- #48 espera el merge de #47 (resuelto hoy con el merge) y review de Luna.

Notas del PO (jueves):
- El push de Avril cumple los tres acuerdos del miércoles y maneja bien el caso borde del redondeo (4200.999 → "4 201", no "4 200,100"). #47 aprobado y mergeado.
- Avril entregó código pero no envió el daily: el daily no es opcional, es la evidencia de Scrum de la rúbrica.
- Luna acumula dos días diciendo "arranco HU-08" sin commits. Le quedan HU-08, HU-12 y las pruebas de HU-09/HU-15 con la review del sábado encima: se le pide rama subida con avance visible antes del viernes 12 pm.
- La review de #48 es de Luna (César la pidió a Avril en el daily; se reasigna a Luna para balancear la participación en reviews).

## Viernes 4 de septiembre

| Integrante | Participó | Resumen |
|---|---|---|
| Alejandro Luna | Sí (10:59 am) | Ayer: subió la rama de HU-08 con tres commits (cliente de API con borrado y reasignación, listado con los cuatro estados, formulario de alta y edición) y abrió el PR #50, ya mergeado. Hoy: cierra HU-08 —al tocar una fila todavía no abre el formulario de edición— prueba nombre duplicado (409) y borrado de categoría con movimientos, y hace la review del #48. Bloqueos: ninguno para el equipo. |
| César Ubau | Sí (11:33 am) | Ayer: trabajó el #49 (datos de demo). Hoy: sin internet. Bloqueos: sin conexión — el #48 queda sin rebasar y el #49 detenido. |
| Avril Madrigal | Sí (11:38 am) | Ayer: cerró los tres acuerdos en la rama de HU-07 (decimales, package-lock, npm ci); #47 mergeado. Hoy: terminó HU-13 y abrió el PR #51 con CI en verde — saldo, resumen del mes, gastos por categoría, evolución mensual y tarjeta de recomendaciones de la IA, probado en web contra el API. Sigue con C-1 (#26), el APK con EAS Build. Bloqueos: ninguno. Aviso: el endpoint de recomendaciones trae `source` (`llm`/`rules`); sin API key las redacta una plantilla. |
| Alejandro Zamora | Sí | Ayer: mergeó #47 y #50, corrigió milestones y fechas de sprints, dejó por escrito el alcance de la IA en el #20. Hoy: review del #51, actas de review/retro y planning del Sprint 2. Bloqueos: ninguno. |

Los tres dailies llegaron antes de las 12 por segunda vez.

Bloqueos abiertos:
- César sin internet: el #48 no se puede rebasar hoy y el #49 queda detenido. Se reevalúa mañana en la review.
- Bug en HU-08 (ya mergeada en #50): al tocar una fila del listado no abre el formulario de edición. Lo resuelve Luna hoy en un PR aparte.

Decisiones del PO (viernes):
- HU-13 entregada con la tarjeta de recomendaciones incluida: con eso el criterio "IA visible en la app" queda cumplido y el objetivo pendiente del Sprint 1 (ver el saldo en la app) se cierra al mergear el #51.
- Avril sigue con el APK (#26) y NO toma HU-12: el APK es lo único que permite verificar SecureStore y la barra nativa, y si EAS falla hay que saberlo ahora. HU-12 se queda con Luna.
- `source` de las recomendaciones: se configura ANTHROPIC_API_KEY en Render para la demo. El motor cae a plantillas solo si el LLM falla, así que la red de seguridad ya está en el diseño; se prueba antes del 16 y, si da problemas, se presenta con reglas.

## Sábado 5 de septiembre

| Integrante | Participó | Resumen |
|---|---|---|
| Alejandro Luna | Sí | Ayer: HU-08 mergeada (#50). Hoy: tres PRs mergeados — #55 (fix del tap en las filas, corregido con lo que salió del review), #56 (HU-12, banner de alertas verificado contra Render con un presupuesto en aviso y otro excedido) y #57 (HU-09, pruebas de integración entre módulos y `--cov-fail-under=80` en el CI: 142 pruebas, 97,48% de cobertura). Con eso cerró el arrastre del Sprint 1. Sigue con `tsc --noEmit` en el CI de mobile, arreglando él los dos errores de tipos del #51. Bloqueos: ninguno. |
| Avril Madrigal | Sí | Ayer: HU-13 entregada (#51). Hoy: arrancó C-1 — proyecto de EAS creado, `eas.json` y `app.json` configurados (nombre BudgetWise, package com.humanoidcat.budgetwise) y primer APK compilado. Detectó que el primer build salió apuntando a localhost porque el `.env` local no viaja al build de EAS; lo corrige declarando `EXPO_PUBLIC_API_URL` en el perfil de EAS. Después arranca el pase visual. Bloqueos: ninguno; pide un Android del equipo para instalar el APK. |
| César Ubau | No | Sin conexión a internet durante el día. Se reincorporó por la noche para la review. |
| Alejandro Zamora | Sí | Revisó y mergeó #55, #56, #57 y #48; rebasó la rama de César para desbloquear el #48; corrigió milestones y fechas; preparó el acta de review y el planning del Sprint 2. Bloqueos: ninguno. |

Hechos del día: se mergearon cinco PRs y el MVP funcional quedó completo — las 6 pantallas de la app funcionando y el Sprint 1 cerrado sin arrastre.

Bloqueos abiertos:
- Ninguno. El dispositivo Android que pedía Avril se resolvió esa misma noche en la review: César y Luna tienen Android y prueban el APK.

## Lunes 7 de septiembre

El domingo 6 se dio libre de daily por ser día de descanso. César entregó igual el PR #59 (C-5, datos de demo), revisado y mergeado ese mismo día.

| Integrante | Participó | Resumen |
|---|---|---|
| Alejandro Luna | Sí (10:23 am) | Ayer: avanzó el chequeo de tipos del CI y dejó arreglados y verificados tres errores — los dos de tipos en los gráficos del dashboard (uno era un bug real: el texto de "no hay suficiente historial" salía sin estilo) y un tercero que solo aparece en el CI, porque `expo-env.d.ts` está en el .gitignore y en un clon limpio faltan las declaraciones de los CSS; se resuelve versionando un archivo de una línea. `tsc --noEmit` sale limpio. Hoy: agrega el paso al job de mobile y abre el PR, dejando dicho que tocó dos archivos de Avril y por qué. Bloqueos: ninguno. |
| César Ubau | Sí (1:05 pm) | Fin de semana: entregó C-5 (#59), el script de semilla — tres meses de movimientos, presupuestos y metas llamando al API, idempotente y con verificación propia de los cuatro criterios de aceptación; documentado en docs/demo.md. Participó en la review y la retro. Hoy: sin issues asignados, se ofrece para las pruebas E2E (#22) o el ensayo de demo (#28). Bloqueos: ninguno propio. Reportó dos cosas del equipo: el #17 sigue abierto aunque está entregado completo, y un error de redacción en las recomendaciones de IA. |
| Avril Madrigal | Sí (tarde) | Ayer: sin avances. Hoy: pase visual de login, registro e Inicio con los bugs #52 (centrado en pantalla ancha) y #53 (error de correo en inglés). **APK compilado y disponible**, apuntando al backend de Render; la configuración va en el #58. Lo publicó por enlace de EAS para instalar desde el celular. Pidió a César y a Luna que confirmen tres cosas: que instale y abra, que al cerrar y reabrir siga la sesión iniciada (prueba de SecureStore, que en web no se puede verificar) y que la barra de pestañas se vea bien. **No da C-1 por cerrada hasta que alguien lo instale**: lo verificado es que compila, no que corra en un teléfono. Bloqueos: ninguno. |
| Alejandro Zamora | Sí | Revisó y mergeó #58 (configuración de EAS) y #59 (datos de demo). Hoy: cierra el #17, corrige la redacción de las recomendaciones, asigna el trabajo de cierre a César. Bloqueos: ninguno. |

Bloqueos abiertos:
- El APK ya está compilado y disponible, pero espera instalación y verificación en Android. Depende de César y Luna, que se comprometieron a eso en la review del sábado.

Decisiones del PO (lunes):
- Se cierra el #17 (metas), entregado completo entre el #39 (API) y el #48 (pantalla). El tablero no puede mostrar como pendiente algo terminado.
- Redacción de las recomendaciones: confirmado el error que reportó César — `_rule_budgets` armaba "Te pasaste de el presupuesto de X". Lo corrige el PO en el mismo módulo (HU-14 es suyo), con `de_label` aparte para respetar la contracción "del" sin romper el caso del presupuesto general ("Te pasaste de tu presupuesto general").
- César toma las pruebas E2E (#22), no el ensayo. El ensayo y el guion de la demo son del PM porque son parte de la presentación oral, que se califica aparte. E2E además cierra la rúbrica de pruebas.

## Martes 8 de septiembre

**Nadie envió daily.**

| Integrante | Participó | Estado real (según PRs y repositorio) |
|---|---|---|
| Avril Madrigal | No envió | Entregó el pase visual en el PR #61: resolvió #52 y #53, agregó el componente Marca y sumó los tonos nuevos al verificador de contraste con sus ratios. Revisado, aprobado y mergeado hoy. |
| Alejandro Luna | No envió | Entregó el chequeo de tipos en el PR #62. Revisado, aprobado y mergeado hoy. Quedó pendiente el detalle de los saltos de línea finales, que se acordó meter en su próximo PR. |
| César Ubau | No envió | Sin PR ni reporte desde el #59 del sábado. Tiene asignadas las pruebas E2E (#22). |
| Alejandro Zamora | Sí | Revisó y mergeó #61 y #62. |

Con esos dos merges, el pase visual y el chequeo de tipos quedaron en main: de aquí en adelante ningún PR entra con un estilo inexistente o una propiedad mal tipada.

Bloqueos abiertos:
- **C-1 en riesgo.** El APK está disponible desde ayer y nadie lo ha instalado. Es lo único del cierre que no se puede verificar de otra forma; ni el build web ni el iPhone de Avril sirven para probar la persistencia de sesión.
- **HU-15 (#22) sin reporte.** Las pruebas E2E de César no tienen avance conocido desde el sábado.

Nota: el corte de control acordado en la planning es mañana miércoles 9. La disciplina de dailies se cayó justo la víspera.
