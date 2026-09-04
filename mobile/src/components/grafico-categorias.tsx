/**
 * Gastos por categoría — HU-13. Wireframe: docs/wireframes/03-inicio.svg
 *
 * Barras horizontales con su etiqueta y su porcentaje. El porcentaje va SIEMPRE
 * como texto: un gráfico que solo se distingue por color no se lee sin ver
 * color, y en esta app el color ya carga significado propio (ingreso/gasto).
 */

import { StyleSheet, Text, View } from 'react-native';

import type { TotalesCategoria } from '@/api/transactions';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { montoConSimbolo } from '@/lib/formato';

const ALTO_BARRA = 10;
const CUANTAS = 4;

/** Paleta del gráfico. No aportan significado: el dato lo dan etiqueta y %. */
const COLORES = [Palette.primario, Palette.ingreso, Palette.advertencia, Palette.gasto];
const COLOR_OTROS = Palette.textoSuave;

type Fila = { nombre: string; monto: number; porcentaje: number; color: string };

/**
 * Deja las categorías con gasto, de mayor a menor, y junta la cola en "Otros".
 *
 * Con nueve categorías por defecto, mostrarlas todas da nueve barras que en su
 * mayoría rozan el cero. Cuatro más "Otros" es lo que cabe legible en 390 pt.
 */
function preparar(porCategoria: TotalesCategoria[], totalGasto: number): Fila[] {
  if (totalGasto <= 0) return [];

  const conGasto = porCategoria
    .filter((c) => c.expense > 0)
    .sort((a, b) => b.expense - a.expense);

  const principales = conGasto.slice(0, CUANTAS).map((c, i) => ({
    nombre: c.category_name ?? 'Sin categoría',
    monto: c.expense,
    porcentaje: (c.expense / totalGasto) * 100,
    color: COLORES[i % COLORES.length],
  }));

  const resto = conGasto.slice(CUANTAS);
  if (resto.length) {
    const monto = resto.reduce((suma, c) => suma + c.expense, 0);
    principales.push({
      nombre: `Otros (${resto.length})`,
      monto,
      porcentaje: (monto / totalGasto) * 100,
      color: COLOR_OTROS,
    });
  }

  return principales;
}

export function GraficoCategorias({
  porCategoria,
  totalGasto,
}: {
  porCategoria: TotalesCategoria[];
  totalGasto: number;
}) {
  const filas = preparar(porCategoria, totalGasto);

  if (filas.length === 0) {
    return <Text style={estilos.vacio}>No hay gastos este mes.</Text>;
  }

  return (
    <View style={estilos.contenedor}>
      {filas.map((f) => (
        <View key={f.nombre} style={estilos.fila}>
          <View style={estilos.filaTexto}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {f.nombre}
            </Text>
            <Text style={estilos.porcentaje}>{Math.round(f.porcentaje)} %</Text>
          </View>

          <View style={estilos.riel}>
            <View
              style={[
                estilos.relleno,
                { width: `${Math.max(2, f.porcentaje)}%`, backgroundColor: f.color },
              ]}
            />
          </View>

          <Text style={estilos.monto}>{montoConSimbolo(f.monto)}</Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: Spacing.three },
  fila: { gap: Spacing.one },
  filaTexto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  nombre: { flex: 1, fontSize: FontSize.etiqueta, color: Palette.texto },
  porcentaje: { fontSize: FontSize.etiqueta, fontWeight: '600', color: Palette.textoSuave },
  // Pastilla: el radio es la mitad del alto. Un valor fijo grande la deforma.
  riel: {
    height: ALTO_BARRA,
    borderRadius: Radius.pastilla(ALTO_BARRA),
    backgroundColor: Palette.borde,
    overflow: 'hidden',
  },
  relleno: { height: '100%', borderRadius: Radius.pastilla(ALTO_BARRA) },
  monto: { fontSize: FontSize.micro, color: Palette.textoSuave },
  vacio: { fontSize: FontSize.cuerpo, color: Palette.textoSuave },
});
