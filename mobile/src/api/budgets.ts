/**
 * Presupuestos (HU-11, de Zamora).
 *
 * HU-12 leía nada más. Desde que existe la pantalla de presupuestos también
 * escribe: el estado del mes ya viene calculado por el backend, con el
 * gastado, el porcentaje y las alertas resueltas. La app no recalcula nada,
 * así el umbral vive en un solo lugar.
 */

import { api } from './client';

/**
 * BudgetStatus en el contrato.
 *
 * - `ok`: menos del 80% del límite.
 * - `warning`: 80% o más, todavía dentro del límite.
 * - `exceeded`: pasó el límite.
 */
export type EstadoPresupuesto = 'ok' | 'warning' | 'exceeded';

/** BudgetStatusOut. */
export type PresupuestoConEstado = {
  id: number;
  /** null = presupuesto global del mes, no de una categoría. */
  category_id: number | null;
  /** null cuando es el global; la app muestra "Total del mes" en ese caso. */
  category_name: string | null;
  monthly_limit: number;
  spent: number;
  remaining: number;
  /** Puede pasar de 100 cuando el presupuesto está excedido. */
  percent_used: number;
  status: EstadoPresupuesto;
};

/** BudgetSummaryOut. */
export type ResumenPresupuestos = {
  /** YYYY-MM */
  month: string;
  budgets: PresupuestoConEstado[];
  /** Solo los que están en warning o exceeded. Es lo que dibuja el banner. */
  alerts: PresupuestoConEstado[];
  has_alerts: boolean;
};

/** GET /budgets/status — sin `month` usa el mes actual. Requiere Bearer. */
export function obtenerEstadoPresupuestos(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return api<ResumenPresupuestos>(`/budgets/status${query}`);
}

/** Lo que devuelve el PUT. El estado (gastado, %, etc.) llega por /status. */
export type Presupuesto = {
  id: number;
  /** null = presupuesto general, el que cubre todo el mes. */
  category_id: number | null;
  monthly_limit: number;
};

/**
 * PUT /budgets — crea o actualiza. Es upsert por (usuario, categoría): mandar
 * dos veces la misma categoría no duplica, pisa el límite anterior. Por eso la
 * pantalla no necesita saber si ya existía.
 *
 * `categoryId` en null define el presupuesto GENERAL.
 */
export function guardarPresupuesto(categoryId: number | null, monthlyLimit: number) {
  return api<Presupuesto>('/budgets', {
    method: 'PUT',
    body: JSON.stringify({ category_id: categoryId, monthly_limit: monthlyLimit }),
  });
}

/** DELETE /budgets/{id} — quita el límite, no toca los movimientos. */
export function eliminarPresupuesto(id: number) {
  return api<void>(`/budgets/${id}`, { method: 'DELETE' });
}
