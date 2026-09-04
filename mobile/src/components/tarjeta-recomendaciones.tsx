/**
 * Tarjeta de recomendaciones — HU-13 / HU-14.
 *
 * Es lo que cumple el criterio "IA visible en la app": el endpoint solo no
 * cuenta como entregado.
 *
 * La severidad se muestra con PALABRA y color, nunca solo con color. Es la
 * misma regla de S0-7, y aquí pesa más todavía: una recomendación crítica que
 * solo se distingue por ser roja no se distingue para quien no ve rojo.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Recomendacion, Severidad } from '@/api/ai';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

const NIVEL: Record<Severidad, { palabra: string; color: string }> = {
  info: { palabra: 'Sugerencia', color: Palette.primario },
  warning: { palabra: 'Atención', color: Palette.advertencia },
  critical: { palabra: 'Importante', color: Palette.gasto },
};

type Props = {
  recomendaciones: Recomendacion[];
  cargando: boolean;
  error: string | null;
  alReintentar: () => void;
};

export function TarjetaRecomendaciones({
  recomendaciones,
  cargando,
  error,
  alReintentar,
}: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>Recomendaciones</Text>

      {cargando ? (
        <ActivityIndicator color={Palette.primario} style={estilos.centrado} />
      ) : error ? (
        <View style={estilos.filaError}>
          {/* Un fallo acá no debe tumbar el resto del dashboard: se avisa en la
              tarjeta y las demás secciones siguen mostrando sus datos. */}
          <Text style={estilos.textoError}>{error}</Text>
          <Pressable onPress={alReintentar} accessibilityRole="button">
            <Text style={estilos.accion}>Reintentar</Text>
          </Pressable>
        </View>
      ) : recomendaciones.length === 0 ? (
        <Text style={estilos.vacio}>
          Nada que sugerir por ahora. Registrá movimientos y volvé a mirar.
        </Text>
      ) : (
        <View style={estilos.lista}>
          {recomendaciones.map((r, i) => {
            const nivel = NIVEL[r.severity] ?? NIVEL.info;
            return (
              <View key={`${r.type}-${i}`} style={estilos.item}>
                <View style={[estilos.marca, { backgroundColor: nivel.color }]} />
                <View style={estilos.itemTexto}>
                  <Text style={[estilos.nivel, { color: nivel.color }]}>{nivel.palabra}</Text>
                  <Text style={estilos.itemTitulo}>{r.title}</Text>
                  <Text style={estilos.mensaje}>{r.message}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  titulo: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  centrado: { alignSelf: 'center' },
  lista: { gap: Spacing.three },
  item: { flexDirection: 'row', gap: Spacing.three },
  /** Franja de color a la izquierda. Acompaña a la palabra, no la reemplaza. */
  marca: { width: 4, borderRadius: 2 },
  itemTexto: { flex: 1, gap: 2 },
  nivel: { fontSize: FontSize.micro, fontWeight: '700', textTransform: 'uppercase' },
  itemTitulo: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.texto },
  mensaje: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  vacio: { fontSize: FontSize.cuerpo, color: Palette.textoSuave },
  filaError: { gap: Spacing.two },
  textoError: { fontSize: FontSize.etiqueta, color: Palette.gasto },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
});
