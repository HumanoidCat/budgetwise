/**
 * Identidad de la app.
 *
 * Antes esto dibujaba un ₡ dentro de un cuadrado con Views. Se cambió por el
 * logotipo real, y no por gusto: el ícono en la pantalla de inicio del celular
 * es el cerdito, así que una marca distinta adentro le daba dos identidades al
 * mismo producto. Quien instala la app ve una cosa y al abrirla ve otra.
 *
 * Dos piezas, cada una con su tamaño, y no son intercambiables:
 *
 *   · EL LOGOTIPO (dibujo + palabra) para login y registro, donde hay espacio
 *     para leerlo. Aguanta bien de 180 px de ancho para arriba.
 *   · EL ÍCONO de la app para encabezados chicos. El dibujo suelto a 40 px es
 *     una mancha — tiene demasiadas partes — y el ícono ya está resuelto para
 *     ese tamaño, que es justamente para lo que existe.
 *
 * La API es la misma de antes a propósito, para no tocar las pantallas que ya
 * lo usan: `conNombre={false}` sigue dando la marca chica.
 */

import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

/** alto ÷ ancho del archivo. Si se reemplaza logo.png, recalcular. */
const RELACION = 0.8833;

type Props = {
  /**
   * Tamaño en puntos. Con nombre es el ANCHO del logotipo; sin nombre, el
   * LADO del ícono.
   */
  tamano?: number;
  /** Logotipo completo (dibujo + palabra). Sin esto, solo el ícono. */
  conNombre?: boolean;
  /** Frase bajo el logotipo. */
  bajada?: string;
};

export function Marca({ tamano, conNombre = true, bajada }: Props) {
  // El rol y la etiqueta van en la View y no en la Image: para un lector de
  // pantalla esto es el logo, no un archivo suelto.
  if (!conNombre) {
    const lado = tamano ?? 48;
    return (
      <View accessibilityRole="image" accessibilityLabel="BudgetWise">
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: lado, height: lado, borderRadius: Radius.campo }}
          contentFit="contain"
        />
      </View>
    );
  }

  const ancho = tamano ?? 220;
  return (
    <View style={estilos.contenedor}>
      <View accessibilityRole="image" accessibilityLabel="BudgetWise">
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: ancho, height: Math.round(ancho * RELACION) }}
          contentFit="contain"
        />
      </View>
      {bajada ? <Text style={estilos.bajada}>{bajada}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', gap: Spacing.two },
  bajada: {
    fontSize: FontSize.cuerpo,
    color: Palette.textoSuave,
    textAlign: 'center',
  },
});
