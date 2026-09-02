import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

/**
 * Barra de pestañas en navegador. Su gemelo para celular es app-tabs.tsx.
 *
 * La API es distinta: aquí se usa Tabs/TabList/TabTrigger de expo-router/ui,
 * con href por pestaña, mientras que en nativo se usa NativeTabs con name.
 * TODA pestaña que se agregue aquí hay que agregarla también allá.
 *
 * Va abajo, como en los wireframes. La plantilla de Expo la traía arriba y
 * flotante, con la marca "Expo Starter" y un enlace a los docs de Expo; eso se
 * quitó porque no es parte de la app.
 *
 * Sin iconos a propósito: en navegador las etiquetas se leen de sobra y evita
 * mantener una segunda forma de cargar los PNG.
 */

const PESTANAS = [
  { name: 'index', href: '/', etiqueta: 'Inicio' },
  { name: 'movimientos', href: '/movimientos', etiqueta: 'Movimientos' },
  { name: 'metas', href: '/metas', etiqueta: 'Metas' },
  { name: 'ajustes', href: '/ajustes', etiqueta: 'Ajustes' },
] as const;

export default function AppTabs() {
  return (
    <Tabs style={estilos.raiz}>
      <TabSlot style={estilos.contenido} />
      <TabList asChild>
        <BarraInferior>
          {PESTANAS.map((p) => (
            <TabTrigger key={p.name} name={p.name} href={p.href} asChild>
              <BotonPestana>{p.etiqueta}</BotonPestana>
            </TabTrigger>
          ))}
        </BarraInferior>
      </TabList>
    </Tabs>
  );
}

export function BotonPestana({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [estilos.boton, pressed && estilos.presionado]}>
      <Text style={[estilos.etiqueta, isFocused && estilos.etiquetaActiva]}>{children}</Text>
    </Pressable>
  );
}

export function BarraInferior(props: TabListProps) {
  return (
    <View {...props} style={estilos.barra}>
      <View style={estilos.barraInterna}>{props.children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  contenido: {
    // flex: 1 y no height: '100%'. Con altura fija el contenido ocupa toda la
    // ventana y empuja la barra fuera de la pantalla.
    flex: 1,
  },
  barra: {
    width: '100%',
    backgroundColor: Palette.superficie,
    borderTopWidth: 1,
    borderTopColor: Palette.borde,
    alignItems: 'center',
  },
  barraInterna: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  boton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.campo,
  },
  presionado: {
    opacity: 0.7,
  },
  etiqueta: {
    fontSize: FontSize.etiqueta,
    color: Palette.textoSuave,
  },
  etiquetaActiva: {
    color: Palette.primario,
    fontWeight: '600',
  },
});
