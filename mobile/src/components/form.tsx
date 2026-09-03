/**
 * Piezas de formulario de BudgetWise.
 *
 * Usan `Palette` y no los componentes con tema del andamiaje (`ThemedText`,
 * `ThemedView`), porque esos consumen `Colors`, que es la paleta de la
 * plantilla de Expo. `Palette` es el sistema visual de la app, definido en
 * S0-7. Conviven las dos mientras el andamiaje no migre.
 */

import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

type CampoProps = TextInputProps & {
  etiqueta: string;
  /** Mensaje bajo el campo. Si viene, el borde se pinta en color de error. */
  error?: string | null;
  /** Texto de ayuda permanente, p. ej. la regla de la contraseña. */
  ayuda?: string;
};

export const Campo = forwardRef<TextInput, CampoProps>(function Campo(
  { etiqueta, error, ayuda, style, ...props },
  ref,
) {
  const conError = Boolean(error);

  return (
    <View style={estilos.campoContenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        ref={ref}
        style={[estilos.entrada, conError && estilos.entradaError, style]}
        placeholderTextColor={Palette.deshabilitado}
        // El lector de pantalla necesita saber el nombre del campo y si falló:
        // el color del borde no le dice nada.
        accessibilityLabel={etiqueta}
        aria-invalid={conError}
        {...props}
      />
      {conError ? (
        <Text style={estilos.textoError} accessibilityRole="alert">
          {error}
        </Text>
      ) : ayuda ? (
        <Text style={estilos.textoAyuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
});

type BotonProps = {
  children: string;
  onPress: () => void;
  /** Inactivo: no responde al toque y se ve apagado. */
  deshabilitado?: boolean;
  /** Muestra un indicador en lugar del texto. También bloquea el toque. */
  cargando?: boolean;
};

export function BotonPrimario({ children, onPress, deshabilitado, cargando }: BotonProps) {
  const inactivo = Boolean(deshabilitado) || Boolean(cargando);

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: Boolean(cargando) }}
      style={({ pressed }) => [
        estilos.boton,
        inactivo && estilos.botonInactivo,
        pressed && !inactivo && estilos.botonPresionado,
      ]}>
      {cargando ? (
        <ActivityIndicator color={Palette.primarioTexto} />
      ) : (
        <Text style={estilos.botonTexto}>{children}</Text>
      )}
    </Pressable>
  );
}

/** Mensaje de error de la llamada al API, arriba del botón. */
export function AvisoError({ mensaje }: { mensaje: string }) {
  return (
    <View style={estilos.aviso} accessibilityRole="alert">
      <Text style={estilos.avisoTexto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  campoContenedor: {
    gap: Spacing.two,
  },
  etiqueta: {
    fontSize: FontSize.etiqueta,
    color: Palette.textoSuave,
  },
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
  entradaError: {
    borderColor: Palette.gasto,
  },
  textoError: {
    fontSize: FontSize.etiqueta,
    color: Palette.gasto,
  },
  textoAyuda: {
    fontSize: FontSize.micro,
    color: Palette.textoSuave,
  },
  boton: {
    height: 52,
    borderRadius: Radius.boton,
    backgroundColor: Palette.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonInactivo: {
    backgroundColor: Palette.deshabilitado,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonTexto: {
    fontSize: FontSize.subtitulo,
    fontWeight: '600',
    color: Palette.primarioTexto,
  },
  aviso: {
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.gasto,
    borderRadius: Radius.campo,
    padding: Spacing.three,
  },
  avisoTexto: {
    fontSize: FontSize.cuerpo,
    color: Palette.gasto,
  },
});
