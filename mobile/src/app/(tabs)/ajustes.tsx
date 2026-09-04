/**
 * Ajustes — pendiente de Sprint 2. Wireframe: docs/wireframes/07-ajustes.svg
 *
 * Marcador de posicion de S0-4: la ruta existe y la pestana navega. El
 * contenido llega con su historia.
 */

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Spacing } from '@/constants/theme';

export default function Pantalla() {
  const router = useRouter();

  return (
    <View style={estilos.raiz}>
      <Text style={estilos.titulo}>Ajustes</Text>
      <Pressable onPress={() => router.push('/categorias')} accessibilityRole="button">
        <Text style={estilos.enlace}>Categorías</Text>
      </Pressable>
      <Text style={estilos.nota}>Perfil, moneda y cierre de sesion.</Text>
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
    enlace: {
    fontSize: FontSize.subtitulo,
    fontWeight: '600',
    color: Palette.primario,
  },
});
