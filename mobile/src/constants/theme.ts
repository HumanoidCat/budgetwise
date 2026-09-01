/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/* ------------------------------------------------------------------------ */
/* BudgetWise · sistema visual (S0-7)                                        */
/*                                                                           */
/* Todo lo de arriba viene de la plantilla de Expo y lo usan los componentes */
/* con tema del andamiaje. No se toca. Lo de aquí abajo es la paleta propia  */
/* de la app, y es la que usan las pantallas de BudgetWise.                  */
/*                                                                           */
/* Decisión principal: el color primario es AZUL, no verde. En esta app el   */
/* verde y el rojo ya significan ingreso y gasto — son los únicos colores    */
/* que cargan un dato por sí solos. Un botón primario verde haría que el     */
/* mismo verde signifique dos cosas en la misma pantalla, y en la pantalla   */
/* de alta de movimiento pasaría literalmente: botón verde debajo de un      */
/* monto verde.                                                              */
/*                                                                           */
/* Regla que se desprende: el color NUNCA va solo. Todo monto lleva signo,   */
/* el selector de tipo dice "Gasto" e "Ingreso" con palabras, y cada tramo   */
/* de gráfico lleva etiqueta y porcentaje.                                   */
/*                                                                           */
/* Solo modo claro. El modo oscuro queda fuera del alcance del MVP del 16    */
/* de septiembre; `Colors.dark` de arriba sigue existiendo para el           */
/* andamiaje, pero las pantallas de BudgetWise no lo consumen todavía.       */
/*                                                                           */
/* verificar_contraste.py (en docs/wireframes/) lee ESTE bloque para medir   */
/* el contraste. Lee el archivo, no una copia — si cambiás un hex aquí, la   */
/* verificación mide el valor nuevo.                                         */
/* ------------------------------------------------------------------------ */

export const Palette = {
  /** Fondo de pantalla */
  fondo: '#F5F7FA',
  /** Tarjetas, campos, barras */
  superficie: '#FFFFFF',
  /** Texto principal */
  texto: '#14181F',
  /** Etiquetas, fechas, texto secundario */
  textoSuave: '#5A6474',
  /** Separación decorativa entre tarjetas */
  borde: '#E2E7EE',
  /** Borde de campos de formulario */
  bordeCampo: '#868D99',
  /** Botones, enlaces, pestaña activa, foco */
  primario: '#2A5BD7',
  /** Texto sobre `primario` */
  primarioTexto: '#FFFFFF',
  /** Chips y estados seleccionados */
  primarioSuave: '#EAF0FE',
  /** Dinero que entra */
  ingreso: '#0F7A44',
  /** Dinero que sale, y errores */
  gasto: '#B32D33',
  /** Avisos que no son error */
  advertencia: '#8A5300',
  /** Controles inactivos */
  deshabilitado: '#98A1AE',
} as const;

export type PaletteColor = keyof typeof Palette;

/** Radios. Para una pastilla no se usa un número grande: es la mitad del alto. */
export const Radius = {
  campo: 10,
  tarjeta: 14,
  boton: 12,
  /** Pastillas y chips: usar altura / 2, nunca un valor fijo grande. */
  pastilla: (altura: number) => altura / 2,
} as const;

/** Escala tipográfica, en puntos. */
export const FontSize = {
  monto: 28,
  titulo: 22,
  subtitulo: 17,
  cuerpo: 15,
  etiqueta: 13,
  micro: 11,
} as const;
