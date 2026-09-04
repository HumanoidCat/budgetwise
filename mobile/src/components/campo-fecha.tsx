/**
 * Campo de fecha.
 *
 * Es un campo de texto YYYY-MM-DD con un botón "Hoy", no un calendario. La
 * razón es de riesgo, no de gusto: un selector de fecha de verdad es un módulo
 * nativo, y un módulo nativo no se puede probar en Expo Go ni en el navegador,
 * así que quedaría escrito y sin verificar hasta que salga el APK (C-1), a
 * pocos días de la entrega.
 *
 * Está aislado en su propio archivo a propósito. Cambiarlo por un calendario
 * —o agregar un campo-fecha.web.tsx que use <input type="date"> del navegador,
 * que es gratis y sí es un calendario— es tocar solo este archivo.
 */

import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { hoyISO } from '@/lib/formato';

type Props = {
  valor: string;
  alCambiar: (iso: string) => void;
  error?: string | null;
  editable?: boolean;
};

export function CampoFecha({ valor, alCambiar, error, editable = true }: Props) {
  const conError = Boolean(error);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.fila}>
        <Text style={estilos.etiqueta}>Fecha</Text>
        <Pressable onPress={() => alCambiar(hoyISO())} disabled={!editable}>
          <Text style={estilos.hoy}>Hoy</Text>
        </Pressable>
      </View>

      <TextInput
        value={valor}
        onChangeText={alCambiar}
        placeholder="2026-09-02"
        placeholderTextColor={Palette.deshabilitado}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
        accessibilityLabel="Fecha, en formato año-mes-día"
        aria-invalid={conError}
        style={[estilos.entrada, conError && estilos.entradaError]}
      />

      <Text style={[estilos.ayuda, conError && estilos.ayudaError]}>
        {error ?? 'Formato año-mes-día, por ejemplo 2026-09-02.'}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: Spacing.two },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  hoy: { fontSize: FontSize.etiqueta, fontWeight: '600', color: Palette.primario },
  entrada: {
    height: 48,
    borderWidth: 1,
    borderColor: Palette.bordeCampo,
    borderRadius: Radius.campo,
    paddingHorizontal: Spacing.three,
    fontSize: FontSize.cuerpo,
    color: Palette.texto,
    backgroundColor: Palette.superficie,
  },
  entradaError: { borderColor: Palette.gasto },
  ayuda: { fontSize: FontSize.micro, color: Palette.textoSuave },
  ayudaError: { color: Palette.gasto },
});
