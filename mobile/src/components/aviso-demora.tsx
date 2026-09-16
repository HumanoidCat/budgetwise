/**
 * Aviso de «el servidor está despertando».
 *
 * El backend vive en el plan gratis de Render, que duerme el servicio tras
 * ~15 minutos sin tráfico. El arranque en frío tarda cerca de 50 segundos y,
 * sin este aviso, la app muestra un spinner mudo todo ese rato: se ve idéntico
 * a una app colgada. La espera no se puede acortar; lo que sí se puede es
 * explicarla.
 *
 * Va montado una sola vez en el layout raíz, no por pantalla: el cliente HTTP
 * cuenta las peticiones lentas en vuelo y este componente solo escucha.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { escucharDemora } from '@/api/client';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

export function AvisoDemora() {
  const [tardando, setTardando] = useState(false);

  useEffect(() => {
    escucharDemora(setTardando);
    return () => escucharDemora(null);
  }, []);

  if (!tardando) return null;

  return (
    <View style={estilos.raiz} pointerEvents="none" accessibilityRole="alert">
      <View style={estilos.pastilla}>
        <Text style={estilos.texto}>
          El servidor está despertando. Esto puede tardar hasta un minuto la primera vez.
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Flota sobre el contenido para no reacomodar la pantalla al aparecer: un
  // banner que empuja el layout hace saltar lo que la persona está leyendo.
  raiz: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.five,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    zIndex: 10,
  },
  pastilla: {
    backgroundColor: Palette.texto,
    borderRadius: Radius.tarjeta,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    maxWidth: 420,
  },
  texto: {
    color: Palette.fondo,
    fontSize: FontSize.etiqueta,
    textAlign: 'center',
  },
});
