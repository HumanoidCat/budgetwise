import { Stack } from 'expo-router';

/**
 * Grupo de rutas sin sesión: login y registro.
 *
 * Va en un Stack y no en las pestañas a propósito: estas pantallas no llevan
 * barra de navegación inferior, y desde ellas no se puede llegar al resto de
 * la app.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
