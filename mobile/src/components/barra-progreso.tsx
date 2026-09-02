/**
 * Barra de progreso de una meta. Wireframe: docs/wireframes/06-metas.svg
 *
 * Dos reglas que vienen del sistema visual (S0-7):
 *
 * - Es una pastilla: el radio es la MITAD del alto, vía `Radius.pastilla`. Un
 *   radio fijo grande sobre una barra de 12 la convierte en elipse.
 * - El color nunca va solo. El porcentaje se muestra siempre como texto al
 *   lado, así que la barra se lee igual sin distinguir colores.
 */

import { StyleSheet, View } from 'react-native';

import { Palette, Radius } from '@/constants/theme';

const ALTO = 12;

export function BarraProgreso({ porcentaje }: { porcentaje: number }) {
  // El API puede devolver más de 100 si se ahorró de más: la barra se recorta,
  // el texto del porcentaje no (esa decisión vive en la pantalla).
  const relleno = Math.max(0, Math.min(100, porcentaje));
  const completa = porcentaje >= 100;

  return (
    <View
      style={estilos.riel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(relleno) }}>
      <View
        style={[
          estilos.relleno,
          { width: `${relleno}%`, backgroundColor: completa ? Palette.ingreso : Palette.primario },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  riel: {
    height: ALTO,
    borderRadius: Radius.pastilla(ALTO),
    backgroundColor: Palette.primarioSuave,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: Radius.pastilla(ALTO),
  },
});
