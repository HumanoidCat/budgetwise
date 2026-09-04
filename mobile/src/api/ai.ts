/**
 * Recomendaciones de la IA (HU-14).
 *
 * El criterio "IA visible en la app" se cumple con la tarjeta del dashboard:
 * el endpoint por sí solo no cuenta como entregado.
 */

import { api } from './client';

/** Nivel de una recomendación. Nunca se muestra solo con color. */
export type Severidad = 'info' | 'warning' | 'critical';

/** RecommendationOut en el contrato. */
export type Recomendacion = {
  /** Clave interna del tipo de recomendación, p. ej. presupuesto excedido. */
  type: string;
  severity: Severidad;
  title: string;
  message: string;
};

/** RecommendationsOut. */
export type Recomendaciones = {
  /** YYYY-MM */
  month: string;
  /**
   * Cómo se redactaron: "llm" si había API key y la llamada al modelo
   * funcionó, "rules" (plantillas) en cualquier otro caso. Conviene mirarlo
   * antes de la demo: sin key configurada, las recomendaciones llegan igual
   * pero no las escribe la IA.
   */
  source: 'rules' | 'llm';
  recommendations: Recomendacion[];
};

/** GET /ai/recommendations — sin `month` usa el mes actual. */
export function obtenerRecomendaciones(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return api<Recomendaciones>(`/ai/recommendations${query}`);
}
