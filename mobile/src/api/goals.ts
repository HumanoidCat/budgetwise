/**
 * Metas de ahorro (HU-10).
 *
 * Los tipos salen del contrato real del backend. El avance (`progress`,
 * `remaining`, `completed`) lo calcula el API, no la pantalla: así la barra y
 * el porcentaje siempre coinciden con lo que dice el servidor.
 */

import { api } from './client';

/** GoalOut en el contrato. */
export type Meta = {
  id: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  /** YYYY-MM-DD, o null si no tiene fecha límite. */
  due_date: string | null;
  /** Porcentaje ahorrado. Puede pasar de 100: la barra lo recorta, el texto no. */
  progress: number;
  /** Lo que falta. Nunca negativo: si se ahorró de más, es 0. */
  remaining: number;
  completed: boolean;
};

export type NuevaMeta = {
  name: string;
  /** Mayor a 0. */
  target_amount: number;
  due_date?: string | null;
};

/** GET /goals — de mayor a menor avance, como en el wireframe. */
export function listarMetas() {
  return api<Meta[]>('/goals');
}

/** GET /goals/{id} → GoalOut. 404 si no existe o es de otra persona. */
export function obtenerMeta(id: number) {
  return api<Meta>(`/goals/${id}`);
}

/** POST /goals → 201 GoalOut. Arranca con 0 ahorrado. */
export function crearMeta(datos: NuevaMeta) {
  return api<Meta>('/goals', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * PATCH /goals/{id} — solo se aplican los campos presentes.
 *
 * `due_date: null` SÍ es un cambio válido: quita la fecha límite. `saved_amount`
 * no existe en este contrato a propósito; lo ahorrado solo se mueve con aportes.
 */
export function actualizarMeta(id: number, cambios: Partial<NuevaMeta>) {
  return api<Meta>(`/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  });
}

/**
 * POST /goals/{id}/contributions → 201 GoalOut con el avance recalculado.
 *
 * Se manda el monto del aporte, no el total ahorrado. Mandar el total haría que
 * dos aportes simultáneos desde dos dispositivos se pisaran y se perdiera uno.
 */
export function aportarAMeta(id: number, amount: number) {
  return api<Meta>(`/goals/${id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

/** DELETE /goals/{id} → 204 sin cuerpo. */
export function borrarMeta(id: number) {
  return api<void>(`/goals/${id}`, { method: 'DELETE' });
}
