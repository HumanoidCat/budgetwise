/**
 * Utilidades compartidas de las pruebas E2E.
 *
 * La app es React Native Web: los componentes no exponen `data-testid`, pero sí
 * `accessibilityLabel` y `accessibilityRole`, que React Native Web traduce a
 * `aria-label` y `role`. Por eso todos los selectores de aquí son por rol y por
 * nombre accesible. Tiene una ventaja que no es casual: si una prueba deja de
 * encontrar un botón, casi siempre es porque alguien le quitó su etiqueta
 * accesible — o sea, la suite también vigila la accesibilidad.
 *
 * POR QUÉ TODO SE FILTRA POR `visible`
 *
 * Expo Router no desmonta la pantalla anterior al navegar: la deja en el DOM,
 * oculta. Así que en la pantalla de registro hay DOS campos con
 * `aria-label="Correo"` — el del login, invisible, y el de registro — y
 * Playwright en modo estricto se niega a adivinar cuál. Filtrar por visibilidad
 * resuelve eso sin recurrir a `.first()` o `.last()`, que dependen del orden en
 * que React monta las pantallas y se romperían el día que alguien cambie la
 * navegación.
 */
import { expect, type Locator, type Page } from '@playwright/test';

/** Contraseña que cumple el mínimo de 8 caracteres del backend. */
export const CLAVE = 'clave12345';

/** Un campo de texto de la pantalla que se está viendo. */
export function campo(page: Page, etiqueta: string): Locator {
  return page.getByLabel(etiqueta, { exact: true }).filter({ visible: true });
}

/** Un botón de la pantalla que se está viendo. */
export function boton(page: Page, nombre: string | RegExp): Locator {
  return page.getByRole('button', { name: nombre }).filter({ visible: true });
}

/**
 * Una pestaña de la barra inferior.
 *
 * Va aparte de `boton` porque en web las pestañas son `role="tab"` y no
 * `role="button"`: `app-tabs.web.tsx` usa TabTrigger con href, que es lo
 * correcto —una pestaña navega, no ejecuta una acción— y lo que un lector de
 * pantalla espera encontrar.
 */
export function pestana(page: Page, nombre: string): Locator {
  return page.getByRole('tab', { name: nombre }).filter({ visible: true });
}

/**
 * Un texto de la pantalla que se está viendo.
 *
 * `exacto` importa más de lo que parece en esta app: el dashboard repite
 * palabras entre las etiquetas y las recomendaciones —"Gastos del mes" está en
 * la tarjeta y también dentro de "…de tus gastos del mes no tienen
 * categoría"—, y sin coincidencia exacta el selector encuentra dos cosas
 * distintas y Playwright se niega a elegir.
 */
export function texto(
  page: Page,
  contenido: string | RegExp,
  exacto = false,
): Locator {
  return page.getByText(contenido, { exact: exacto }).filter({ visible: true });
}

/**
 * Correo único por corrida.
 *
 * Las pruebas crean usuarios de verdad contra el backend desplegado. Un correo
 * fijo haría que la segunda corrida fallara con "ese correo ya está
 * registrado", que es un falso negativo: la app funciona, la prueba está mal
 * escrita.
 *
 * El dominio es `budgetwise.app` y NO `budgetwise.test`, que sería lo intuitivo
 * para un correo de prueba. Pydantic valida con `email-validator`, que rechaza
 * los dominios reservados de la RFC 2606 — `.test`, `.invalid`, `.example`,
 * `.localhost`. Con uno de esos, el backend devuelve 422 y la app muestra
 * "Escribí un correo válido": la prueba fallaría por el dato inventado, no por
 * un defecto del producto. Es el mismo dominio que usa la cuenta de demo en
 * `docs/demo.md`, así que ya está probado contra este backend.
 */
export function correoDePrueba(etiqueta: string): string {
  const sello = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `e2e.${etiqueta}.${sello}@budgetwise.app`;
}

/** Abre la app y espera a que el arranque termine. */
export async function abrirApp(page: Page) {
  await page.goto('/');
  // El layout raíz muestra un indicador mientras comprueba el token guardado.
  // Esperar al campo de correo es esperar a que esa comprobación terminara.
  await expect(campo(page, 'Correo')).toBeVisible({ timeout: 90_000 });
}

/** Registra una cuenta nueva y deja la sesión abierta en el dashboard. */
export async function registrarse(page: Page, nombre: string, correo: string) {
  await abrirApp(page);
  await page.getByRole('link', { name: /Crear cuenta/ }).click();

  await campo(page, 'Nombre').fill(nombre);
  await campo(page, 'Correo').fill(correo);
  await campo(page, 'Contraseña').fill(CLAVE);
  await boton(page, 'Crear cuenta').click();

  // El registro devuelve token, así que la persona entra de una vez: la puerta
  // de acceso del layout raíz redirige sola al dashboard.
  await expect(texto(page, `Hola, ${nombre}`)).toBeVisible({ timeout: 90_000 });
}

/** Entra con una cuenta existente. */
export async function iniciarSesion(page: Page, correo: string, clave = CLAVE) {
  await campo(page, 'Correo').fill(correo);
  await campo(page, 'Contraseña').fill(clave);
  await boton(page, 'Iniciar sesión').click();
}

/**
 * Guarda un movimiento desde el formulario.
 *
 * `tipo` usa las palabras que ve la persona, no los valores del API: si alguien
 * cambia "Gasto" por "Egreso" en la interfaz, esta prueba tiene que fallar.
 */
export async function guardarMovimiento(
  page: Page,
  tipo: 'Gasto' | 'Ingreso',
  monto: string,
  nota?: string,
) {
  await expect(texto(page, 'Nuevo movimiento')).toBeVisible({ timeout: 30_000 });
  await boton(page, tipo).click();
  await campo(page, 'Monto').fill(monto);
  if (nota) await campo(page, 'Nota').fill(nota);
  await boton(page, 'Guardar movimiento').click();
}
