import { Text, View } from 'react-native';
import { Palette, FontSize } from '@/constants/theme';

/** Marcador de posición. La pantalla real llega en el siguiente paso de HU-06. */
export default function Pantalla() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.fondo }}>
      <Text style={{ fontSize: FontSize.titulo, color: Palette.texto }}>login</Text>
    </View>
  );
}
