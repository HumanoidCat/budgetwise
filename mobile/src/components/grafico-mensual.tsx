/**
 * Evolución mensual — HU-13. Wireframe: docs/wireframes/03-inicio.svg
 *
 * Dos barras por mes, ingresos y gastos, con leyenda en palabras. La leyenda no
 * es decoración: sin ella el gráfico depende de distinguir verde de rojo, que
 * es justo lo que el sistema visual de S0-7 prohíbe.
 *
 * La serie la da GET /transactions/monthly, del mes más viejo al más nuevo y
 * con los meses sin movimientos en cero, así que no hay huecos que rellenar.
 */

import { StyleSheet, Text, View } from 'react-native';

import type { TotalesMes } from '@/api/transactions';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { etiquetaMes, montoConSimbolo } from '@/lib/formato';

const ALTO = 120;
const MINIMO_VISIBLE = 3;

export function GraficoMensual({ meses }: { meses: TotalesMes[] }) {
  // Una sola escala para las dos series: si cada una se escalara a su propio
  // máximo, un mes de ₡5 000 en ingresos se vería igual de alto que uno de
  // ₡500 000 en gastos.
  const tope = Math.max(...meses.flatMap((m) => [m.income, m.expense]), 0);

  if (meses.length === 0 || tope === 0) {
    return <Text style={estilos.vacio}>Todavía no hay suficiente historial.</Text>;
  }

  const alturaDe = (valor: number) =>
    valor <= 0 ? 0 : Math.max(MINIMO_VISIBLE, (valor / tope) * ALTO);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.leyenda}>
        <View style={estilos.leyendaItem}>
          <View style={[estilos.muestra, { backgroundColor: Palette.ingreso }]} />
          <Text style={estilos.leyendaTexto}>Ingresos</Text>
        </View>
        <View style={estilos.leyendaItem}>
          <View style={[estilos.muestra, { backgroundColor: Palette.gasto }]} />
          <Text style={estilos.leyendaTexto}>Gastos</Text>
        </View>
      </View>

      <View style={estilos.grafico}>
        {meses.map((m) => (
          <View key={m.month} style={estilos.columna}>
            <View style={estilos.barras}>
              <View
                style={[
                  estilos.barra,
                  { height: alturaDe(m.income), backgroundColor: Palette.ingreso },
                ]}
                accessibilityLabel={`Ingresos de ${etiquetaMes(m.month)}: ${montoConSimbolo(m.income)}`}
              />
              <View
                style={[
                  estilos.barra,
                  { height: alturaDe(m.expense), backgroundColor: Palette.gasto },
                ]}
                accessibilityLabel={`Gastos de ${etiquetaMes(m.month)}: ${montoConSimbolo(m.expense)}`}
              />
            </View>
            <Text style={estilos.etiqueta}>{etiquetaMes(m.month)}</Text>
          </View>
        ))}
      </View>

      <Text style={estilos.escala}>Barra más alta: {montoConSimbolo(tope)}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: Spacing.three },
  leyenda: { flexDirection: 'row', gap: Spacing.four },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  muestra: { width: 10, height: 10, borderRadius: 5 },
  leyendaTexto: { fontSize: FontSize.micro, color: Palette.textoSuave },
  grafico: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: ALTO + 24,
  },
  columna: { flex: 1, alignItems: 'center', gap: Spacing.two },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: ALTO },
  barra: { width: 12, borderTopLeftRadius: Radius.campo / 2, borderTopRightRadius: Radius.campo / 2 },
  etiqueta: { fontSize: FontSize.micro, color: Palette.textoSuave },
  escala: { fontSize: FontSize.micro, color: Palette.textoSuave },
});
