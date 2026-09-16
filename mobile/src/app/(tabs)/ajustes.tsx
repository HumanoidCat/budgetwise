/**
 * Ajustes — cuenta, atajos de configuración y cierre de sesión.
 *
 * Wireframe: docs/wireframes/07-ajustes.svg
 *
 * Antes era un marcador de posición que mostraba la etiqueta «Sprint 2» en
 * pantalla. El cierre de sesión era el hueco grave: `salir()` estaba
 * implementado en el contexto de auth desde el principio y ninguna pantalla lo
 * llamaba, así que no había forma de cambiar de cuenta sin desinstalar la app.
 */

import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomTabInset, FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

/** Una fila que navega a otra pantalla. */
function Fila({ titulo, nota, alTocar }: { titulo: string; nota: string; alTocar: () => void }) {
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.fila, pressed && estilos.filaTocada]}>
      <View style={estilos.filaTexto}>
        <Text style={estilos.filaTitulo}>{titulo}</Text>
        <Text style={estilos.filaNota}>{nota}</Text>
      </View>
      <Text style={estilos.chevron}>›</Text>
    </Pressable>
  );
}

export default function Pantalla() {
  const router = useRouter();
  const { usuario, salir } = useAuth();

  function confirmarSalida() {
    // Alert.alert no hace nada en React Native Web: sin esta bifurcación, en el
    // navegador el botón no mostraría nada y tampoco cerraría la sesión, en
    // silencio. Mismo patrón que en meta.tsx y movimiento.tsx.
    const mensaje = '¿Cerrar sesión? Vas a tener que entrar de nuevo con tu correo y contraseña.';

    if (Platform.OS === 'web') {
      if (window.confirm(mensaje)) void salir();
      return;
    }

    Alert.alert('Cerrar sesión', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void salir() },
    ]);
  }

  const nombre = usuario?.name?.trim();
  const inicial = (nombre || usuario?.email || '?').charAt(0).toUpperCase();

  return (
    <ScrollView style={estilos.raiz} contentContainerStyle={estilos.contenido}>
      <Text style={estilos.titulo}>Ajustes</Text>

      <View style={estilos.tarjeta}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{inicial}</Text>
        </View>
        <View style={estilos.cuentaTexto}>
          <Text style={estilos.cuentaNombre}>{nombre || 'Tu cuenta'}</Text>
          {usuario?.email ? <Text style={estilos.cuentaCorreo}>{usuario.email}</Text> : null}
        </View>
      </View>

      <View style={estilos.grupo}>
        <Fila
          titulo="Categorías"
          nota="Creá y editá las categorías de tus movimientos"
          alTocar={() => router.push('/categorias')}
        />
        <View style={estilos.separador} />
        <Fila
          titulo="Presupuestos"
          nota="Definí cuánto podés gastar cada mes"
          alTocar={() => router.push('/presupuestos')}
        />
      </View>

      <Pressable
        onPress={confirmarSalida}
        accessibilityRole="button"
        style={({ pressed }) => [estilos.salir, pressed && estilos.filaTocada]}>
        <Text style={estilos.salirTexto}>Cerrar sesión</Text>
      </Pressable>

      <Text style={estilos.version}>BudgetWise 1.0.0</Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Palette.fondo },
  contenido: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  titulo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },

  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    borderColor: Palette.borde,
    padding: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.pastilla(48),
    backgroundColor: Palette.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: FontSize.subtitulo, fontWeight: '700', color: Palette.primario },
  cuentaTexto: { flex: 1, gap: Spacing.half },
  cuentaNombre: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  cuentaCorreo: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },

  grupo: {
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    borderColor: Palette.borde,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    // 48 pt es el mínimo táctil: una fila más baja se vuelve difícil de
    // atinar, sobre todo para quien tiene menos pulso.
    minHeight: 48,
  },
  filaTocada: { backgroundColor: Palette.primarioSuave },
  filaTexto: { flex: 1, gap: Spacing.half },
  filaTitulo: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.texto },
  filaNota: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  chevron: { fontSize: FontSize.titulo, color: Palette.textoSuave },
  separador: { height: 1, backgroundColor: Palette.borde, marginLeft: Spacing.three },

  salir: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.boton,
    borderWidth: 1,
    borderColor: Palette.borde,
    padding: Spacing.three,
  },
  // El rojo va en el texto y no en un botón relleno: cerrar sesión es
  // reversible (se vuelve a entrar), así que no merece el peso visual de una
  // acción destructiva de verdad, pero sí distinguirse de las filas de arriba.
  salirTexto: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.gasto },

  version: { fontSize: FontSize.micro, color: Palette.textoSuave, textAlign: 'center' },
});
