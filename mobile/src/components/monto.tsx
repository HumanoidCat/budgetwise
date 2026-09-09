/**
 * Monto — el único componente autorizado a pintar plata en pantalla.
 *
 * Existe por una razón concreta: `fontVariant: ['tabular-nums']` hay que
 * ponerlo en CADA estilo que muestre un número, y eso no sobrevive a cuatro
 * personas trabajando en paralelo. Alguien agrega una fila nueva, se le olvida,
 * y esa columna queda bailando mientras las demás alinean. Centralizarlo acá
 * convierte una regla que hay que recordar en un import.
 *
 * REGLA: si un monto se ve en pantalla y no pasó por este componente, es un bug.
 *
 * El signo va siempre para ingreso/gasto, no solo el color: el verde y el rojo
 * de la paleta contrastan entre sí 1,16:1, o sea que en escala de grises son
 * exactamente el mismo color.
 */

import { StyleSheet, Text, type TextProps } from 'react-native';

import type { TipoMovimiento } from '@/api/transactions';
import { FontSize, Palette, Tipografia } from '@/constants/theme';
import { montoConSigno, montoConSimbolo } from '@/lib/formato';

type Props = TextProps & {
  cantidad: number;
  /** Con `tipo`, el monto sale con signo y color. Sin él, sale como saldo. */
  tipo?: TipoMovimiento;
  /** `saldo` para el número grande del dashboard, `fila` para listas. */
  variante?: 'saldo' | 'fila' | 'etiqueta';
  /** Neutraliza el color pero conserva el signo. Para totales y encabezados. */
  neutro?: boolean;
};

export function Monto({
  cantidad,
  tipo,
  variante = 'fila',
  neutro = false,
  style,
  ...resto
}: Props) {
  const texto = tipo ? montoConSigno(cantidad, tipo) : montoConSimbolo(cantidad);
  const color = neutro || !tipo
    ? Palette.texto
    : tipo === 'income'
      ? Palette.ingreso
      : Palette.gasto;

  return (
    <Text
      style={[estilos.base, estilos[variante], { color }, style]}
      // El lector de pantalla lee «menos 38 450 colones», no «- 38 450».
      accessibilityLabel={
        tipo
          ? `${tipo === 'income' ? 'más' : 'menos'} ${Math.abs(cantidad)} colones`
          : `${cantidad} colones`
      }
      {...resto}
    >
      {texto}
    </Text>
  );
}

const estilos = StyleSheet.create({
  base: { ...Tipografia.tabular },
  saldo: { fontSize: FontSize.monto, fontWeight: '600', letterSpacing: -0.5 },
  fila: { fontSize: FontSize.cuerpo, fontWeight: '600' },
  etiqueta: { fontSize: FontSize.etiqueta, fontWeight: '500' },
});
