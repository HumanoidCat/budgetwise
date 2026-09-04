/**
 * Categorías (HU-03, de Luna).
 *
 * Al registrarse se crean nueve categorías por defecto, así que la lista nunca
 * llega vacía para un usuario nuevo.
 */

import { api } from './client';

/** CategoryOut en el contrato. */
export type Categoria = {
  id: number;
  name: string;
  /** Nombre corto del icono, p. ej. "tag". Todavía no se dibuja en la app. */
  icon: string;
};

/** GET /categories → CategoryOut[], ordenadas por nombre. Requiere Bearer. */
export function listarCategorias() {
  return api<Categoria[]>('/categories');
}


export type NuevaCategoria = {
  /** 1 a 80 caracteres. El backend recorta los espacios sobrantes. */
  name: string;
  /** Nombre corto del icono. Si no viene, el backend usa "tag". */
  icon?: string;
};

/** POST /categories → 201 CategoryOut. 409 si ya existe una con ese nombre. */
export function crearCategoria(datos: NuevaCategoria) {
  return api<Categoria>('/categories', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/** PATCH /categories/{id} — solo se aplican los campos presentes. */
export function actualizarCategoria(id: number, cambios: Partial<NuevaCategoria>) {
  return api<Categoria>(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  });
}

/**
 * DELETE /categories/{id} → 204 sin cuerpo.
 *
 * Devuelve 409 si la categoría está en uso. Con `reasignarA`, las
 * transacciones se mueven a esa categoría antes de borrar. Un presupuesto
 * asociado hay que quitarlo aparte: ese caso no se reasigna.
 */
export function borrarCategoria(id: number, reasignarA?: number) {
  const query = reasignarA !== undefined ? `?reassign_to=${reasignarA}` : '';
  return api<void>(`/categories/${id}${query}`, { method: 'DELETE' });
}