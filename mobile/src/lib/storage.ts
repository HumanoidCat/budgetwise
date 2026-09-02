/**
 * Guarda el token de sesión entre arranques de la app.
 *
 * En celular usa expo-secure-store, que es lo que pide el criterio de HU-06:
 * el llavero de iOS y el almacén cifrado de Android.
 *
 * En web SecureStore NO existe. Como el equipo está desarrollando contra el
 * build web mientras Expo Go no soporte SDK 57, aquí cae a localStorage para
 * que la app funcione en el navegador.
 *
 * IMPORTANTE: localStorage no está cifrado y cualquier script de la página lo
 * lee. Sirve para desarrollo, NO para la demo ni para producción. El criterio
 * de aceptación de HU-06 solo se puede dar por cumplido probando en un
 * teléfono real.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CLAVE = 'budgetwise.token';

export async function guardarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(CLAVE, token);
    return;
  }
  await SecureStore.setItemAsync(CLAVE, token);
}

export async function leerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(CLAVE);
  }
  return SecureStore.getItemAsync(CLAVE);
}

export async function borrarToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(CLAVE);
    return;
  }
  await SecureStore.deleteItemAsync(CLAVE);
}
