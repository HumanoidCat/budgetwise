/**
 * Crear cuenta — HU-06. Wireframe: docs/wireframes/02-registro.svg
 *
 * El backend devuelve token en el registro (201 TokenOut), así que al crear la
 * cuenta la persona queda dentro. No se la manda a iniciar sesión.
 */

import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/api/client';
import { AvisoError, BotonPrimario, Campo } from '@/components/form';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { Marca } from '@/components/marca';
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

  const scrollRef = useRef<ScrollView>(null);

  /**
   * Acompaña al `behavior="padding"` de arriba.
   *
   * El padding hace que el contenido supere la altura visible, así que el
   * ScrollView pasa a ser desplazable; esto lo lleva al final para que el botón
   * quede a la vista sin que la persona tenga que arrastrar.
   *
   * Los 120 ms esperan a que el teclado termine de abrirse: sin esa pausa el
   * desplazamiento se calcula contra la altura anterior y se queda corto.
   */
  function alEnfocar() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }

  return (
    /* `behavior="padding"` en AMBAS plataformas, no solo en iOS.
       Expo SDK 57 activa edge-to-edge en Android por defecto: la ventana ya
       no se redimensiona al abrir el teclado, el teclado se dibuja encima. Con
       `undefined` en Android el componente no hacía nada y el botón quedaba
       tapado. Con `padding`, KeyboardAvoidingView lee la altura del teclado
       del evento y agrega ese espacio abajo, que es lo único que funciona
       cuando la ventana no encoge. */
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior="padding"
      keyboardVerticalOffset={0}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled">
        <Marca tamano={48} conNombre={false} />
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>Crear cuenta</Text>
          <Text style={estilos.subtitulo}>Se crean nueve categorías para empezar.</Text>
        </View>

        <View style={estilos.tarjeta}>
          <Campo
            etiqueta="Nombre"
            onFocus={alEnfocar}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            autoCapitalize="words"
            autoComplete="name"
            editable={!enviando}
          />

          <Campo
            etiqueta="Correo"
            onFocus={alEnfocar}
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
            onFocus={alEnfocar}
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

        </View>

        <Link href="/login" style={estilos.enlace}>
          ¿Ya tenés cuenta? Iniciar sesión
        </Link>
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
    gap: Spacing.four,
    maxWidth: 480,
    width: '100%',
    // Ver la nota del bug #52 en login.tsx.
    marginHorizontal: 'auto',
  },
  encabezado: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    color: Palette.texto,
  },
  subtitulo: {
    fontSize: FontSize.cuerpo,
    color: Palette.textoSuave,
  },
  tarjeta: {
    gap: Spacing.four,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.four,
  },
  enlace: {
    textAlign: 'center',
    fontSize: FontSize.cuerpo,
    color: Palette.primario,
  },
});
