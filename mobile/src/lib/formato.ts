/**
 * Formato de montos y fechas.
 *
 * Está aparte de las pantallas porque la lista, el formulario y el dashboard
 * tienen que mostrar un monto exactamente igual. Tres copias de la misma
 * lógica es como se acaba con "₡4200" en una pantalla y "+ 4 200" en otra.
 */

import type { TipoMovimiento } from '@/api/transactions';

/**
 * Convierte "2026-09-02" en una fecha LOCAL.
 *
 * `new Date('2026-09-02')` la interpreta como medianoche UTC. En Costa Rica
 * (UTC-6) eso son las 6 p.m. del día ANTERIOR, así que un movimiento de hoy se
 * mostraría con la fecha de ayer. Por eso se parte la cadena a mano.
 */
export function fechaLocal(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** Fecha de hoy en YYYY-MM-DD, según el reloj local. */
export function hoyISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** ¿La cadena tiene forma YYYY-MM-DD y es una fecha que existe? */
export function fechaValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [anio, mes, dia] = iso.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia);
  // Si el mes se desbordó (31 de febrero), Date lo corre al mes siguiente.
  return d.getFullYear() === anio && d.getMonth() === mes - 1 && d.getDate() === dia;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Encabezado de grupo en la lista: "Hoy", "Ayer" o "31 de agosto". */
export function etiquetaFecha(iso: string): string {
  const hoy = hoyISO();
  if (iso === hoy) return 'Hoy';

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, '0');
  const ayerISO = `${ayer.getFullYear()}-${p(ayer.getMonth() + 1)}-${p(ayer.getDate())}`;
  if (iso === ayerISO) return 'Ayer';

  const d = fechaLocal(iso);
  const mismoAnio = d.getFullYear() === new Date().getFullYear();
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  return mismoAnio ? base : `${base} de ${d.getFullYear()}`;
}

/**
 * Separador de miles con espacio, como en los wireframes: 462 600.
 *
 * Los céntimos se muestran solo cuando existen: 4200 da "4 200" y 4200.5 da
 * "4 200,50". Coma decimal, que es lo que se usa en Costa Rica.
 *
 * La versión anterior redondeaba con Math.round y se comía los céntimos: un
 * gasto de 4200,50 se mostraba como 4 201. En una app de dinero eso no es un
 * detalle de formato, es un número equivocado en pantalla.
 */
function conMiles(n: number): string {
  // Se redondea a dos decimales ANTES de partir, para que 4200.999 dé
  // "4 201" y no "4 200,100".
  const abs = Math.round(Math.abs(n) * 100) / 100;
  const entero = Math.floor(abs);
  const centimos = Math.round((abs - entero) * 100);

  const enteroTexto = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return centimos === 0
    ? enteroTexto
    : `${enteroTexto},${String(centimos).padStart(2, '0')}`;
}

/**
 * Monto con su signo: "+ 240 000" o "- 4 200".
 *
 * El signo va SIEMPRE, no solo el color. Alrededor del 8 % de los hombres no
 * distingue rojo de verde; con el signo la pantalla se lee igual sin color.
 */
export function montoConSigno(cantidad: number, tipo: TipoMovimiento): string {
  return `${tipo === 'income' ? '+' : '-'} ${conMiles(cantidad)}`;
}

/** Monto sin signo, para saldos: "₡ 462 600". */
export function montoConSimbolo(cantidad: number): string {
  const signo = cantidad < 0 ? '- ' : '';
  return `₡ ${signo}${conMiles(cantidad)}`;
}
