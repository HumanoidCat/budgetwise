/**
 * Pruebas E2E (HU-15) — flujo core contra la app real.
 *
 * Corren sobre el build web de Expo, que es la misma aplicación que el APK:
 * mismos componentes, mismo cliente HTTP, mismo backend. Lo que se prueba aquí
 * es lo que ninguna prueba unitaria ve — que registrarse, guardar un gasto y
 * ver el saldo actualizado funcione de punta a punta a través de la interfaz.
 *
 * El backend es el de Render, no uno de mentiras. Es a propósito: una E2E que
 * habla con un servidor simulado prueba la app contra una suposición.
 */
import { defineConfig, devices } from '@playwright/test';

const PUERTO = 8081;

export default defineConfig({
  testDir: './e2e',

  // Render duerme el servicio del plan gratis y tarda ~50 s en despertar. Sin
  // estos márgenes, la primera prueba de cada corrida fallaría por algo que no
  // es un defecto de la app.
  timeout: 120_000,
  expect: { timeout: 30_000 },

  // Secuencial: las pruebas crean usuarios y movimientos en la misma base.
  fullyParallel: false,
  workers: 1,

  // Reintento solo en CI, donde la latencia de red es menos predecible.
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    // Traza y captura solo del primer reintento: sirven para depurar sin
    // llenar el disco en cada corrida verde.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Levanta el servidor web solo. Si ya hay uno corriendo, lo reutiliza: así
  // se puede dejar `npx expo start --web` abierto mientras se itera.
  webServer: {
    command: `npx expo start --web --port ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
