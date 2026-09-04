# Sprint 2 — Planning

**Fecha:** sábado 5 de septiembre de 2026, a continuación de la review del Sprint 1
**Duración del sprint:** domingo 6 – sábado 12 de septiembre de 2026
**Entrega final:** miércoles 16 de septiembre de 2026

## Asistencia

| Integrante | Asistencia |
|---|---|
| Alejandro Zamora | |
| Alejandro Luna | |
| César Ubau | |
| Avril Madrigal | |

## Objetivo del sprint

Que la app quede completa y presentable: las seis pantallas funcionando contra el API desplegado, con el saldo, el gráfico y las recomendaciones de la IA visibles, y el APK instalado en un teléfono. Al cerrar este sprint la demo del 16 tiene que poder ensayarse de punta a punta.

Traducción práctica: **el 12 de septiembre no debe quedar ninguna funcionalidad pendiente**, solo pulido, ensayo y filminas.

## Historias comprometidas

| Issue | Historia | Responsable | Pts | Prioridad |
|---|---|---|---|---|
| #20 | HU-13 Dashboard de Inicio: saldo, resumen del mes, gráfico de evolución **y tarjeta de recomendaciones de la IA** | Avril Madrigal | 5 | P0 |
| #41 | HU-10b Pantalla de metas de ahorro (PR #48 en curso) | César Ubau | 3 | P0 |
| #19 | HU-12 Alertas de presupuesto en la app | Alejandro Luna | 3 | P0 |
| #16 | HU-09 Pruebas de integración entre módulos + umbral de cobertura en CI (arrastre) | Alejandro Luna | 3 | P1 |
| #22 | HU-15 Pruebas E2E del flujo core | César Ubau | 5 | P1 |
| #49 | C-5 Script de datos de demo | César Ubau | 2 | P1 |
| #26 | C-1 APK con EAS Build instalado en teléfonos | Avril Madrigal | 3 | P0 |
| #27 | C-2 Filminas de la presentación (máx. 5) | Alejandro Zamora | 3 | P1 |

Total comprometido: 27 pts.

### Notas de reparto

- **HU-13 es la historia más importante del proyecto.** Cierra el objetivo pendiente del Sprint 1 (ver el saldo en la app), suma los 5 pts de dashboard de la rúbrica y es la única forma de que los 6 pts de IA cuenten. Va primero, antes que cualquier otra cosa de Avril.
- **HU-15 pasa de Luna a César.** Luna arrastra HU-09 y tiene HU-12; César cerró todo su backlog y es quien más rápido entrega. Las pruebas E2E cruzan todos los módulos y él los conoce completos.
- **El APK no se deja para el final.** EAS Build puede fallar por configuración y no se descubre eso el día 15. Se genera apenas el dashboard esté en main, aunque falte pulido.

## Fuera de este sprint (semana de cierre, 13 – 16 sep)

| Issue | Tarea | Responsable |
|---|---|---|
| #28 | C-3 Ensayo de la demo en vivo con guion | Alejandro Zamora |
| #29 | C-4 Hardening: bugs, estados vacíos, mensajes de error | Alejandro Zamora |

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| HU-13 se entrega sin la tarjeta de IA | Se pierden 6 pts de rúbrica con el trabajo ya hecho | Criterio escrito en el issue #20; se verifica en la review del PR |
| El APK falla en EAS y se descubre tarde | No hay demo en teléfono | Se genera en cuanto el dashboard entre a main, no al final |
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
