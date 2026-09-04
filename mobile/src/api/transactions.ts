/**
 * Transacciones (HU-07).
 *
 * Los tipos salen del contrato real del backend (openapi.json).
 * Ojo con `type`: el API usa 'income' y 'expense' en inglés. La traducción a
 * "Ingreso" y "Gasto" es cosa de la interfaz, no del modelo.
 */

import { api } from './client';

export type TipoMovimiento = 'income' | 'expense';

/** TransactionOut en el contrato. */
export type Movimiento = {
  id: number;
  type: TipoMovimiento;
  /** Siempre positivo. El signo lo pone el tipo, no el monto. */
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  category_id: number | null;
  category_name: string | null;
  description: string;
};

/** TransactionListOut: `total` es el conteo con filtros, sin paginar. */
export type ListaMovimientos = {
  items: Movimiento[];
  total: number;
  limit: number;
  offset: number;
};

export type FiltrosMovimientos = {
  type?: TipoMovimiento;
  category_id?: number;
  /** YYYY-MM-DD, inclusive */
  date_from?: string;
  date_to?: string;
  /** 1 a 200; el backend usa 50 por defecto. */
  limit?: number;
  offset?: number;
};

/** GET /transactions — de la más reciente a la más antigua. */
export function listarMovimientos(filtros: FiltrosMovimientos = {}) {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null) query.set(clave, String(valor));
  }
  const cadena = query.toString();
  return api<ListaMovimientos>(`/transactions${cadena ? `?${cadena}` : ''}`);
}

export type NuevoMovimiento = {
  type: TipoMovimiento;
  /** Mayor a 0. El user_id no viaja en el cuerpo: sale del token. */
  amount: number;
  date: string;
  category_id?: number | null;
  description?: string;
};

/** POST /transactions → 201 TransactionOut */
export function crearMovimiento(datos: NuevoMovimiento) {
  return api<Movimiento>('/transactions', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * PATCH /transactions/{id} — solo se aplican los campos presentes.
 *
 * `category_id: null` SÍ es un cambio válido: quita la categoría. El resto de
 * los campos, si llegan en null, se ignoran.
 */
export function actualizarMovimiento(id: number, cambios: Partial<NuevoMovimiento>) {
  return api<Movimiento>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  });
}

/** DELETE /transactions/{id} → 204 sin cuerpo */
export function borrarMovimiento(id: number) {
  return api<void>(`/transactions/${id}`, { method: 'DELETE' });
}

/* ------------------------------------------------------------------------ */
/* Resumen y evolución mensual — HU-13                                       */
/* ------------------------------------------------------------------------ */

/** MonthTotalsOut. Lo usan tanto el resumen como la serie mensual. */
export type TotalesMes = {
  income: number;
  expense: number;
  balance: number;
  /** YYYY-MM */
  month: string;
};

/** CategoryTotalsOut. `category_id` null agrupa lo que no tiene categoría. */
export type TotalesCategoria = {
  income: number;
  expense: number;
  balance: number;
  category_id: number | null;
  category_name: string | null;
};

/** SummaryOut. */
export type Resumen = {
  /** Saldo histórico: todos los ingresos menos todos los gastos. */
  balance: number;
  total_income: number;
  total_expense: number;
  /** Totales del mes consultado. */
  month: TotalesMes;
  by_category: TotalesCategoria[];
};

/**
 * GET /transactions/summary — saldo histórico y detalle del mes.
 *
 * Sin `month` devuelve el mes actual. Formato YYYY-MM.
 */
export function obtenerResumen(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return api<Resumen>(`/transactions/summary${query}`);
}

/** MonthlyOut: la serie viene del mes más viejo al más nuevo. */
export type Evolucion = {
  months: TotalesMes[];
};

/**
 * GET /transactions/monthly — serie para el gráfico de Inicio.
 *
 * Los meses sin movimientos vienen en cero, así que la serie nunca tiene
 * huecos y el gráfico no necesita rellenarlos.
 */
export function evolucionMensual(months = 6) {
  return api<Evolucion>(`/transactions/monthly?months=${months}`);
}
