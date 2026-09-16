/**
 * Asesor conversacional — POST /ai/ask.
 *
 * La diferencia con `obtenerRecomendaciones` (HU-14) no es de tono: aquella
 * responde sin que le pregunten, con reglas fijas. Esta contesta una pregunta
 * escrita por la persona, anclada a sus cifras reales.
 *
 * `contexto` llega completo a propósito. La pantalla muestra los números al
 * lado de la respuesta: un asesor que no enseña de dónde sacó la cifra es un
 * asesor en el que no se confía, y además deja verificable que el modelo no
 * inventó nada.
 */

import { api } from './client';

export type PresupuestoCtx = {
  categoria: string | null;
  limite: number;
  gastado: number;
  disponible: number;
  porcentaje: number;
  estado: 'ok' | 'warning' | 'exceeded';
};

export type CategoriaCtx = {
  nombre: string;
  gastado: number;
  porcentaje_del_gasto: number;
};

export type MetaCtx = {
  nombre: string;
  objetivo: number;
  ahorrado: number;
  porcentaje: number;
};

/** Foto determinista del mes. Todo sale de la base, nada se estima. */
export type ContextoFinanciero = {
  mes: string;
  ingresos: number;
  gastos: number;
  saldo: number;
  dias_del_mes: number;
  dias_transcurridos: number;
  dias_restantes: number;
  gasto_diario_promedio: number;
  /** Lo que queda del presupuesto, o el saldo si no hay presupuesto definido. */
  disponible: number;
  tiene_presupuesto: boolean;
  disponible_por_dia: number;
  presupuestos: PresupuestoCtx[];
  top_categorias: CategoriaCtx[];
  metas: MetaCtx[];
};

/**
 * Aritmética de «¿me alcanza para X?». La calcula el backend en Python, nunca
 * el modelo: un LLM que suma es un LLM que se equivoca.
 */
export type Veredicto = {
  monto: number;
  alcanza: boolean;
  /** Alcanza, pero se lleva la mitad o más de lo disponible. */
  justo: boolean;
  porcentaje_de_lo_disponible: number;
  disponible_despues: number;
  por_dia_despues: number;
  /** Si sigue gastando a su ritmo actual, ¿le llega la plata a fin de mes? */
  ritmo_sostenible: boolean;
  resumen: string;
};

export type RespuestaAsesor = {
  mes: string;
  /**
   * "llm" si redactó el modelo, "rules" si respondieron las plantillas.
   * Conviene mirarlo antes de la demo: sin ANTHROPIC_API_KEY el asesor
   * contesta igual, pero no lo escribe la IA.
   */
  source: 'rules' | 'llm';
  pregunta: string;
  respuesta: string;
  veredicto: Veredicto | null;
  sugerencias: string[];
  contexto: ContextoFinanciero;
};

/** POST /ai/ask — sin `month` usa el mes actual. */
export function preguntarAlAsesor(pregunta: string, month?: string) {
  return api<RespuestaAsesor>('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ question: pregunta, month }),
  });
}
