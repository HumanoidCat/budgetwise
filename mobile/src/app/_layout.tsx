import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth';
import { Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

/**
 * Manda a la persona al grupo de rutas que le corresponde.
 *
 * Sin sesión → (auth). Con sesión → (tabs). Se ejecuta cuando cambia la sesión
 * o el grupo actual, no en cada render, para no pelearse con la navegación.
 */
function PuertaDeAcceso() {
  const { usuario, cargando } = useAuth();
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Mientras se comprueba el token guardado no se decide nada: redirigir
    // aquí hace que el login parpadee para quien ya tenía sesión.
    if (cargando) return;

    const enAuth = segmentos[0] === '(auth)';

    if (!usuario && !enAuth) {
      router.replace('/login');
    } else if (usuario && enAuth) {
      router.replace('/');
    }
  }, [usuario, cargando, segmentos, router]);

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Palette.fondo,
        }}>
        <ActivityIndicator color={Palette.primario} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      {/* Alta y edicion de movimiento: se abre encima de las pestanas y no
          lleva barra inferior, por eso vive fuera de (tabs). */}
      <Stack.Screen name="movimiento" options={{ presentation: 'modal' }} />
      <Stack.Screen name="categorias" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <PuertaDeAcceso />
      </AuthProvider>
    </ThemeProvider>
  );
}
