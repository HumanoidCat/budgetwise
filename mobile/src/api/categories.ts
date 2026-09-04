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
