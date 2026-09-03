/**
 * Movimientos — pendiente de HU-07. Wireframe: docs/wireframes/04-movimientos.svg
 *
 * Marcador de posicion de S0-4: la ruta existe y la pestana navega. El
 * contenido llega con su historia.
 */

import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Spacing } from '@/constants/theme';

export default function Pantalla() {
  return (
    <View style={estilos.raiz}>
      <Text style={estilos.titulo}>Movimientos</Text>
      <Text style={estilos.nota}>Lista de ingresos y gastos, con filtros y alta de movimiento.</Text>
      <Text style={estilos.etiqueta}>HU-07</Text>
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
