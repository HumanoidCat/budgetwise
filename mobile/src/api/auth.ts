/**
 * Endpoints de autenticación.
 *
 * Los tipos salen del contrato real del backend (openapi.json), no de lo que
 * uno supone que devuelve. Si el backend cambia, esto es lo primero que hay
 * que actualizar.
 */

import { api } from './client';

/** UserOut en el contrato. */
export type Usuario = {
  id: number;
  email: string;
  name: string;
};

/** TokenOut en el contrato. */
export type Sesion = {
  access_token: string;
  token_type?: string;
  user: Usuario;
};

/**
 * POST /auth/register → 201 TokenOut
 *
 * Ojo: el registro YA devuelve token y usuario, igual que el login. La persona
 * queda dentro al crear la cuenta; no hay que mandarla a iniciar sesión.
 *
 * `password` lo valida el backend entre 8 y 128 caracteres, `name` es opcional.
 */
export function registrar(email: string, password: string, name: string) {
  return api<Sesion>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

/** POST /auth/login → 200 TokenOut */
export function iniciarSesion(email: string, password: string) {
  return api<Sesion>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * GET /auth/me → 200 UserOut. Requiere Bearer.
 *
 * Sirve para validar al arrancar que el token guardado sigue vivo.
 */
export function yo() {
  return api<Usuario>('/auth/me');
}
