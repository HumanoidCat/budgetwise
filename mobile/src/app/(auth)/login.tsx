/**
 * Iniciar sesión — HU-06. Wireframe: docs/wireframes/01-login.svg
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

/** Suficiente para atajar erratas antes de gastar una llamada. El backend valida en serio. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { entrar } = useAuth();

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const valido = CORREO.test(correo.trim()) && clave.length > 0;

  async function enviar() {
    if (!valido || enviando) return;
    setErrorApi(null);
    setEnviando(true);
    try {
      await entrar(correo.trim(), clave);
      // No se navega desde aquí: la puerta de acceso del layout raíz ve que ya
      // hay sesión y redirige sola. Un router.replace aquí competiría con ella.
    } catch (e) {
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo iniciar sesión.');
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
          <Text style={estilos.titulo}>BudgetWise</Text>
          <Text style={estilos.subtitulo}>Ordená tus ingresos y gastos.</Text>
        </View>

        <View style={estilos.formulario}>
          <Campo
            etiqueta="Correo"
            value={correo}
            onChangeText={setCorreo}
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
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            editable={!enviando}
            onSubmitEditing={enviar}
            returnKeyType="go"
          />

          {errorApi ? <AvisoError mensaje={errorApi} /> : null}

          <BotonPrimario onPress={enviar} deshabilitado={!valido} cargando={enviando}>
            Iniciar sesión
          </BotonPrimario>

          <Link href="/registro" style={estilos.enlace}>
            ¿No tenés cuenta? Crear cuenta
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
    gap: Spacing.six,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  encabezado: {
    gap: Spacing.two,
  },
  titulo: {
    fontSize: 32,
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
