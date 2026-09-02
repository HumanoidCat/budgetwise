/**
 * Metas — pendiente de Sprint 2. Wireframe: docs/wireframes/06-metas.svg
 *
 * Marcador de posicion de S0-4: la ruta existe y la pestana navega. El
 * contenido llega con su historia.
 */

import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Spacing } from '@/constants/theme';

export default function Pantalla() {
  return (
    <View style={estilos.raiz}>
      <Text style={estilos.titulo}>Metas</Text>
      <Text style={estilos.nota}>Metas de ahorro con su progreso.</Text>
      <Text style={estilos.etiqueta}>Sprint 2</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: Palette.fondo,
  },
  titulo: {
    fontSize: FontSize.titulo,
    fontWeight: '700',
    color: Palette.texto,
  },
  nota: {
    fontSize: FontSize.cuerpo,
    color: Palette.textoSuave,
    textAlign: 'center',
  },
  etiqueta: {
    fontSize: FontSize.micro,
    color: Palette.primario,
  },
});
