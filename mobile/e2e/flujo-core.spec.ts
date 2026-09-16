/**
 * HU-15 — Pruebas E2E del flujo core.
 *
 * El flujo core es el que define el producto: una persona se registra, anota
 * lo que gastó y ve cuánto le queda. Si eso funciona, BudgetWise sirve; si se
 * rompe en cualquier eslabón, no sirve — por buenas que estén las pruebas
 * unitarias de cada módulo por separado.
 *
 * Estas pruebas atraviesan las cuatro capas de la arquitectura y la interfaz:
 * router → service → repository → base, y de vuelta hasta el pixel.
 */
import { expect, test } from '@playwright/test';

import {
  abrirApp,
  boton,
  campo,
  CLAVE,
  correoDePrueba,
  guardarMovimiento,
  iniciarSesion,
  pestana,
  registrarse,
  texto,
} from './apoyo';

test.describe('Flujo core', () => {
  test('una cuenta nueva llega al dashboard y ve el estado vacío', async ({ page }) => {
    await registrarse(page, 'Ana', correoDePrueba('vacio'));

    // Una cuenta recién creada no tiene movimientos. El dashboard tiene que
    // decir qué hacer, no quedarse en blanco: un cero sin explicación se ve
    // igual que un error de carga.
    await expect(texto(page, 'Todavía no hay movimientos')).toBeVisible();
    await expect(texto(page, '+ Nuevo movimiento')).toBeVisible();
  });

  test('registrar ingreso y gasto actualiza el saldo del dashboard', async ({ page }) => {
    await registrarse(page, 'Beto', correoDePrueba('gasto'));

    await texto(page, '+ Nuevo movimiento').click();
    await guardarMovimiento(page, 'Ingreso', '100000', 'Salario E2E');

    // Con un ingreso ya hay datos: el estado vacío tiene que desaparecer.
    await expect(texto(page, 'Ingresos del mes', true)).toBeVisible({ timeout: 60_000 });

    // Ahora el gasto. Con datos ya cargados el dashboard deja de mostrar el
    // atajo del estado vacío, así que el alta se abre desde Movimientos.
    await pestana(page, 'Movimientos').click();
    await boton(page, '+ Nuevo').click();
    await guardarMovimiento(page, 'Gasto', '30000', 'Compra E2E');

    await pestana(page, 'Inicio').click();
    await expect(texto(page, 'Gastos del mes', true)).toBeVisible({ timeout: 60_000 });

    // 100 000 − 30 000 = 70 000. Es el momento de la verdad: el saldo lo calcula
    // el backend (HU-05) y lo muestra la app; si alguno de los dos se equivoca,
    // esta aserción falla.
    //
    // Se afirma sobre la etiqueta accesible que pone <Monto> y no sobre el texto
    // en pantalla: ese lleva espacios duros como separador de miles, y
    // compararlo carácter por carácter haría fallar la prueba por un detalle de
    // formato en vez de por un saldo equivocado.
    await expect(page.getByLabel('70000 colones')).toBeVisible({ timeout: 60_000 });
  });

  test('el movimiento guardado aparece en la lista', async ({ page }) => {
    await registrarse(page, 'Caro', correoDePrueba('lista'));

    await texto(page, '+ Nuevo movimiento').click();
    await guardarMovimiento(page, 'Gasto', '12500', 'Almuerzo E2E');

    await pestana(page, 'Movimientos').click();
    await expect(texto(page, 'Almuerzo E2E')).toBeVisible({ timeout: 60_000 });
  });

  test('cerrar sesión devuelve al login y la sesión no sobrevive', async ({ page }) => {
    const correo = correoDePrueba('salir');
    await registrarse(page, 'Dani', correo);

    // En React Native Web la confirmación es un window.confirm, no un
    // Alert.alert. Sin este manejador la prueba se quedaría trabada en el
    // diálogo — y sin la bifurcación de Platform en el código, el botón no
    // haría nada en silencio.
    page.once('dialog', (d) => d.accept());

    await pestana(page, 'Ajustes').click();
    await boton(page, 'Cerrar sesión').click();

    await expect(boton(page, 'Iniciar sesión')).toBeVisible({ timeout: 60_000 });

    // Recargar no debe devolver la sesión: el token se borró de verdad.
    await page.reload();
    await abrirApp(page);
    await expect(boton(page, 'Iniciar sesión')).toBeVisible();

    // Y la cuenta sigue existiendo: cerrar sesión no la destruyó.
    await iniciarSesion(page, correo, CLAVE);
    await expect(texto(page, 'Hola, Dani')).toBeVisible({ timeout: 90_000 });
  });
});

test.describe('Autenticación', () => {
  test('una contraseña incorrecta muestra un mensaje en español', async ({ page }) => {
    const correo = correoDePrueba('malaclave');
    await registrarse(page, 'Eva', correo);

    page.once('dialog', (d) => d.accept());
    await pestana(page, 'Ajustes').click();
    await boton(page, 'Cerrar sesión').click();
    await expect(boton(page, 'Iniciar sesión')).toBeVisible({ timeout: 60_000 });

    await iniciarSesion(page, correo, 'claveequivocada');

    // El mensaje sale tal cual del backend, que ya responde en español
    // (`detail="Correo o contraseña incorrectos"` en auth/service.py). El
    // `generico(401)` de client.ts —que sí lleva punto final— es el respaldo
    // para cuando el servidor no manda nada aprovechable, y aquí no se usa.
    // Por eso la aserción va sin punto: verifica lo que la persona lee, no lo
    // que uno supone que el código produce.
    await expect(texto(page, 'Correo o contraseña incorrectos')).toBeVisible({
      timeout: 60_000,
    });
  });

  test('un correo mal escrito no habilita el botón', async ({ page }) => {
    await abrirApp(page);
    await campo(page, 'Correo').fill('esto-no-es-un-correo');
    await campo(page, 'Contraseña').fill(CLAVE);

    // Validación en la app: se evita el viaje al servidor y el error feo.
    await expect(boton(page, 'Iniciar sesión')).toBeDisabled();
  });
});
