/**
 * Sistema visual de BudgetWise.
 *
 * Lo de arriba (Colors, Fonts, Spacing) viene de la plantilla de Expo y lo usan
 * los componentes con tema del andamiaje. No se toca.
 */

import '@/global.css';
import { Platform, type TextStyle } from 'react-native';

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
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
/* BudgetWise · sistema visual v2                                            */
/*                                                                           */
/* CAMBIO RESPECTO A S0-7: la paleta ya no se inventa, se DERIVA DEL LOGO    */
/* que votó el equipo. Los hex salen de muestrear el archivo del logotipo:   */
/*                                                                           */
/*   navy del wordmark  #0B2546   →  texto (idéntico, sin retocar)           */
/*   azul de la maceta  #3C7ECA   →  primario, oscurecido a #1F5BA6 para AA  */
/*   verde de "wise"    #369C5A   →  familia del ingreso, oscurecido a AA    */
/*   oro de las monedas #FEC84C   →  advertencia (#8A5300 es su versión      */
/*                                    accesible) y el ícono de la app        */
/*   crema del fondo    #FFF9ED   →  fondo de pantalla, desaturado a #F7F3EA */
/*                                                                           */
/* Lo que NO cambió, y es lo importante: el primario sigue sin ser verde ni  */
/* rojo. En esta app el verde y el rojo ya significan ingreso y gasto — son  */
/* los únicos colores que cargan un dato por sí solos. Un botón primario     */
/* verde haría que el mismo verde signifique dos cosas en la misma pantalla, */
/* y en el alta de movimiento pasaría literalmente: botón verde debajo de un */
/* monto verde.                                                              */
/*                                                                           */
/* OJO CON EL LOGOTIPO: el verde de "wise" vive en la marca, no en la UI.    */
/* Dentro de la app, verde = ingreso y nada más.                             */
/*                                                                           */
/* Regla que se desprende: el color NUNCA va solo. Todo monto lleva signo,   */
/* el selector de tipo dice "Gasto" e "Ingreso" con palabras, y cada tramo   */
/* de gráfico lleva etiqueta y porcentaje. Medido: el verde y el rojo        */
/* contrastan entre sí 1,16:1 — en escala de grises son el mismo color.      */
/*                                                                           */
/* Los tintes ingresoSuave y gastoSuave vienen del PR #61 de Avril. Sus hex    */
/* estaban calculados contra el verde viejo (#0F7A44); acá van recalculados    */
/* contra el nuevo (#12793F) y en la familia cálida del fondo, no en blanco    */
/* azulado, para que no desentonen con el hueso.                               */
/*                                                                            */
/* verificar_contraste.py (en docs/wireframes/) lee ESTE bloque para medir   */
/* el contraste. Lee el archivo, no una copia — si cambiás un hex aquí, la   */
/* verificación mide el valor nuevo. Estado: 16 pares, 0 fallos.             */
/* ------------------------------------------------------------------------ */

export const Palette = {
  /** Fondo de pantalla — la crema del logo, desaturada */
  fondo: '#F7F3EA',
  /** Tarjetas, campos, barras */
  superficie: '#FFFFFF',
  /** Hundido: barras de progreso vacías, campos deshabilitados */
  hundido: '#EFE9DC',
  /** Texto principal — el navy exacto del wordmark */
  texto: '#0B2546',
  /** Etiquetas, fechas, texto secundario */
  textoSuave: '#4E5A6B',
  /** Separación decorativa entre tarjetas */
  borde: '#E4DCCC',
  /** Borde de campos de formulario */
  bordeCampo: '#83806F',
  /** Botones, enlaces, pestaña activa, foco — el azul del logo a nivel AA */
  primario: '#1F5BA6',
  /** Texto sobre `primario` */
  primarioTexto: '#FFFFFF',
  /** Chips y estados seleccionados */
  primarioSuave: '#E5EDF8',
  /** Dinero que entra */
  ingreso: '#12793F',
  /** Fondo suave para bloques de ingreso. `ingreso` encima da 4.81:1. */
  ingresoSuave: '#E8F3EB',
  /** Dinero que sale, y errores */
  gasto: '#B32D33',
  /** Fondo suave para bloques de gasto y avisos. `gasto` encima da 5.52:1. */
  gastoSuave: '#FCEDEA',
  /** Avisos que no son error — la versión accesible del oro de las monedas */
  advertencia: '#8A5300',
  /** Controles inactivos */
  deshabilitado: '#97927F',
} as const;

export type PaletteColor = keyof typeof Palette;

/**
 * Modo oscuro. Fuera del alcance del MVP del 26, pero definido y verificado
 * para que quien lo implemente no tenga que inventar los valores ni volver a
 * medir contraste. 16 pares, 0 fallos, igual que el modo claro.
 */
export const PaletteOscura = {
  fondo: '#0A1524',
  superficie: '#132239',
  hundido: '#1D2E48',
  texto: '#EDF1F7',
  textoSuave: '#9FAEC2',
  borde: '#22334E',
  bordeCampo: '#6B7B92',
  primario: '#7FB2EF',
  primarioTexto: '#0B2546',
  primarioSuave: '#1B3252',
  ingreso: '#4FC98C',
  ingresoSuave: '#12301F',
  gasto: '#FF8A8F',
  gastoSuave: '#3A1A1C',
  /** Acá sí entra el oro del logo tal cual: sobre fondo oscuro llega a 11,85:1 */
  advertencia: '#FEC84C',
  deshabilitado: '#6B7B92',
} as const;

/**
 * Los colores del logotipo, tal como están en el archivo. Para splash y marca.
 *
 * Se llama ColoresMarca y no Marca porque `Marca` ya es el COMPONENTE de
 * identidad (mobile/src/components/marca.tsx). Dos cosas con el mismo nombre
 * chocan en el primer archivo que importe las dos.
 */
export const ColoresMarca = {
  navy: '#0B2546',
  verde: '#369C5A',
  oro: '#FEC84C',
  oroBorde: '#E9A72B',
  rosado: '#FEC0AB',
  azul: '#3C7ECA',
  crema: '#FFF9ED',
} as const;

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

/**
 * CIFRAS TABULARES.
 *
 * Sin esto, el «1» ocupa menos que el «0» y una columna de saldos baila:
 * ₡462 600 encima de ₡118 111 quedan desalineados aunque tengan los mismos
 * dígitos. Es el cambio de mayor impacto por menos esfuerzo de todo el sistema
 * visual, y `fontVariant: ['tabular-nums']` está soportado en React Native
 * tanto en iOS como en Android.
 *
 * REGLA: todo componente que muestre plata extiende `Tipografia.tabular`.
 * Si un monto se ve en pantalla y no pasó por aquí, es un bug.
 */
export const Tipografia = {
  /**
   * Va tipado como TextStyle a propósito. Con `as const` el arreglo queda
   * `readonly ['tabular-nums']`, y React Native declara `fontVariant` como
   * `FontVariant[]`, mutable: al hacer `...Tipografia.tabular` dentro de un
   * StyleSheet, TypeScript lo rechaza. Y como StyleSheet.create infiere el
   * tipo de TODAS las claves a la vez, un solo estilo mal tipado hace que el
   * resto del archivo falle con errores que no tienen nada que ver.
   */
  tabular: { fontVariant: ['tabular-nums'] } as TextStyle,
} as const;
