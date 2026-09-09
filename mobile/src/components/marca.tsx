/**
 * Identidad de la app.
 *
 * El símbolo se dibuja con Views y texto, no con una imagen: no hace falta
 * agregar un asset ni una librería, y así se tiñe con la paleta y escala sin
 * perder nitidez.
 *
 * El colón (₡) como marca no es decoración: dice de qué es la app antes de
 * leer el nombre, y ata la identidad a la moneda con la que se trabaja.
 */

import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

type Props = {
  /** Tamaño del cuadro del símbolo, en puntos. */
  tamano?: number;
  /** Muestra el nombre debajo del símbolo. */
  conNombre?: boolean;
  /** Frase bajo el nombre. */
  bajada?: string;
};

export function Marca({ tamano = 60, conNombre = true, bajada }: Props) {
  return (
    <View style={estilos.contenedor}>
      <View
        style={[
          estilos.simbolo,
          { width: tamano, height: tamano, borderRadius: Radius.tarjeta },
        ]}
        // Para un lector de pantalla es el logo, no el carácter suelto.
        accessibilityRole="image"
        accessibilityLabel="BudgetWise">
        <Text style={[estilos.colon, { fontSize: tamano * 0.5 }]}>₡</Text>
      </View>

      {conNombre ? <Text style={estilos.nombre}>BudgetWise</Text> : null}
      {bajada ? <Text style={estilos.bajada}>{bajada}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', gap: Spacing.two },
  simbolo: {
    backgroundColor: Palette.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: { color: Palette.primarioTexto, fontWeight: '700' },
  nombre: {
    fontSize: 30,
    fontWeight: '700',
    color: Palette.texto,
    marginTop: Spacing.two,
  },
  bajada: {
    fontSize: FontSize.cuerpo,
    color: Palette.textoSuave,
    textAlign: 'center',
  },
});
