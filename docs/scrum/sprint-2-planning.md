# Sprint 2 — Planning

**Fecha:** sábado 5 de septiembre de 2026, a continuación de la review del Sprint 1
**Duración del sprint:** domingo 6 – sábado 12 de septiembre de 2026
**Entrega final:** miércoles 16 de septiembre de 2026

## Asistencia

| Integrante | Asistencia |
|---|---|
| Alejandro Zamora | Presente |
| Alejandro Luna | Presente |
| César Ubau | Presente |
| Avril Madrigal | Presente |

## Objetivo del sprint

La funcionalidad del MVP quedó terminada dentro del Sprint 1: las seis pantallas funcionan contra el API desplegado. Este sprint es de **cierre**, no de construcción.

Objetivo: que el 12 de septiembre la demo se pueda ensayar de punta a punta sin sorpresas, con el APK instalado y probado en Android real, datos de demo cargados, las pantallas pulidas y las filminas listas.

## Historias comprometidas

| Issue | Tarea | Responsable | Pts | Prioridad |
|---|---|---|---|---|
| #26 | C-1 APK con EAS Build, instalado y probado en Android real | Avril Madrigal | 3 | P0 |
| — | Pase visual: login, registro e Inicio, más el centrado en pantalla ancha (#52) y el error de correo en inglés (#53) | Avril Madrigal | 3 | P0 |
| #49 | C-5 Script de datos de demo | César Ubau | 2 | P0 |
| #22 | HU-15 Pruebas E2E del flujo core | César Ubau | 5 | P1 |
| — | Chequeo de tipos (`tsc --noEmit`) en el CI de mobile + dos fixes de tipos | Alejandro Luna | 2 | P1 |
| #27 | C-2 Filminas de la presentación (máx. 5) | Alejandro Zamora | 3 | P1 |
| #28 | C-3 Ensayo de la demo en vivo con guion | Alejandro Zamora | 3 | P1 |
| #29 | C-4 Hardening: bugs, estados vacíos, mensajes de error | Alejandro Zamora | 3 | P1 |

Total comprometido: 24 pts.

### Notas de reparto

- **El APK va primero.** Es lo más riesgoso que queda: el primer build salió apuntando a `localhost` porque el `.env` local no viaja al build de EAS. Ese es justamente el tipo de error que no se puede descubrir el día 15.
- **Prueba en Android real.** César y Luna tienen Android y prueban el APK apenas esté: persistencia de sesión (SecureStore) y barra nativa, que no se verifican ni en web ni en el iPhone de Avril.
- **Luna queda como apoyo.** Cerró todo su backlog del Sprint 1; después del chequeo de tipos toma lo que salga del pulido o de las pruebas en dispositivo.
- **El ensayo y el hardening se adelantan** a este sprint: la funcionalidad ya está lista, así que no hay razón para dejarlos a la semana de cierre.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El APK falla en EAS o la sesión no persiste en Android | No hay demo en teléfono | Se genera y se prueba en Android real esta misma semana; César y Luna lo instalan |
| El pase visual toca lógica y rompe pantallas que funcionan | Se pierde funcionalidad ya entregada | Solo estilos y composición, en PR aparte, con tope el lunes 8 |
| Se abre funcionalidad nueva antes de cerrar la entrega | Riesgo directo sobre la demo | Ninguna historia nueva antes de cerrar APK, datos de demo, pulido y filminas |
| Render duerme el servicio (plan free, 15 min) | La demo arranca en blanco | Se despierta el API antes de presentar; el guion lo incluye como primer paso |
| La base de datos gratuita de Render expira ~30 sep | Ninguno para esta entrega | Fuera de ventana; documentado en docs/deploy.md |
| Carga despareja del equipo | Un integrante bloquea la entrega | Corte del miércoles 9: lo que esté en riesgo se reasigna ahí |

## Acuerdos

1. Dailies antes de las 12:00 pm, todos los días. Entregar código no sustituye la daily.
2. Toda rama sale de `main` actualizado. No se abren PRs apilados sobre ramas sin mergear.
3. Una historia está terminada cuando se puede enseñar en la app, no cuando el endpoint responde.
4. El PM asigna revisor al abrir cada PR, repartiendo la carga de revisiones.
5. **Corte de control: miércoles 9 de septiembre.** Se revisa el avance real y se recorta o reasigna lo que esté en riesgo.
6. Merge siempre con squash.
7. **Funcionalidad adicional**: el equipo puede proponer historias nuevas para que la app no quede en el mínimo del MVP, pero solo entran una vez cerrados el APK, los datos de demo, el pase visual y las filminas. Pasan por el PO, se registran como issue y no tocan el flujo que se demuestra el 16.
