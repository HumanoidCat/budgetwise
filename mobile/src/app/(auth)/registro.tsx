/**
 * Crear cuenta — HU-06. Wireframe: docs/wireframes/02-registro.svg
 *
 * El backend devuelve token en el registro (201 TokenOut), así que al crear la
 * cuenta la persona queda dentro. No se la manda a iniciar sesión.
 */

import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/api/client';
import { AvisoError, BotonPrimario, Campo } from '@/components/form';
import { FontSize, Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** El backend exige entre 8 y 128 (UserRegister en el contrato). */
const CLAVE_MIN = 8;

export default function RegistroScreen() {
  const { crearCuenta } = useAuth();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [tocado, setTocado] = useState({ correo: false, clave: false });
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const correoOk = CORREO.test(correo.trim());
  const claveOk = clave.length >= CLAVE_MIN;
  const valido = correoOk && claveOk;

  // El error solo se muestra si la persona ya pasó por el campo: señalar en
  // rojo algo que todavía no ha escrito es regañarla por adelantado.
  const errorCorreo = tocado.correo && !correoOk ? 'Revisá el formato del correo.' : null;
  const errorClave =
    tocado.clave && !claveOk ? `La contraseña necesita al menos ${CLAVE_MIN} caracteres.` : null;

  async function enviar() {
    if (!valido || enviando) return;
    setErrorApi(null);
    setEnviando(true);
    try {
      await crearCuenta(correo.trim(), clave, nombre.trim());
    } catch (e) {
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled">
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>Crear cuenta</Text>
          <Text style={estilos.subtitulo}>Se crean nueve categorías para empezar.</Text>
        </View>

        <View style={estilos.formulario}>
          <Campo
            etiqueta="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            autoCapitalize="words"
            autoComplete="name"
            editable={!enviando}
          />

          <Campo
            etiqueta="Correo"
            value={correo}
            onChangeText={setCorreo}
            onBlur={() => setTocado((t) => ({ ...t, correo: true }))}
            error={errorCorreo}
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!enviando}
          />

          <Campo
            etiqueta="Contraseña"
            value={clave}
            onChangeText={setClave}
            onBlur={() => setTocado((t) => ({ ...t, clave: true }))}
            error={errorClave}
            ayuda={`Mínimo ${CLAVE_MIN} caracteres.`}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!enviando}
            onSubmitEditing={enviar}
            returnKeyType="go"
          />

          {errorApi ? <AvisoError mensaje={errorApi} /> : null}

          <BotonPrimario onPress={enviar} deshabilitado={!valido} cargando={enviando}>
            Crear cuenta
          </BotonPrimario>

          <Link href="/login" style={estilos.enlace}>
            ¿Ya tenés cuenta? Iniciar sesión
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: Palette.fondo,
  },
  contenido: {
    flexGrow: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.five,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  encabezado: {
    gap: Spacing.two,
  },
  titulo: {
    fontSize: FontSize.monto,
    fontWeight: '700',
    color: Palette.texto,
  },
  subtitulo: {
    fontSize: FontSize.cuerpo,
    color: Palette.textoSuave,
  },
  formulario: {
    gap: Spacing.four,
  },
  enlace: {
    textAlign: 'center',
    fontSize: FontSize.cuerpo,
    color: Palette.primario,
  },
});
