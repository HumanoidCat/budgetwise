/**
 * Banner de alertas de presupuesto — HU-12.
 *
 * Va en el dashboard, que es la primera pantalla después de entrar: eso cubre
 * el "al abrir la app" del criterio. Si no hay nada en aviso no dibuja nada,
 * para no gastar el espacio de arriba en un "todo bien".
 *
 * Pide sus propios datos en vez de recibirlos por props. Así el dashboard
 * (HU-13, de Avril) solo suma una línea, y un fallo de /budgets/status no
 * puede tumbar el saldo ni el gráfico.
 *
 * El umbral del 80% lo decide el backend (WARNING_THRESHOLD en budgets). Acá
 * no se recalcula nada: se muestra lo que viene en `alerts`.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { obtenerEstadoPresupuestos, type EstadoPresupuesto, type PresupuestoConEstado } from '@/api/budgets';
import { ApiError } from '@/api/client';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { montoConSimbolo } from '@/lib/formato';

/**
 * Palabra y color por estado. La palabra va siempre: una alerta que solo se
 * distingue por ser roja no se distingue para quien no ve rojo (regla S0-7).
 */
const NIVEL: Record<Exclude<EstadoPresupuesto, 'ok'>, { palabra: string; color: string }> = {
  warning: { palabra: 'Cerca del límite', color: Palette.advertencia },
  exceeded: { palabra: 'Excedido', color: Palette.gasto },
};

export function AlertaPresupuesto() {
  const [alertas, setAlertas] = useState<PresupuestoConEstado[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const resumen = await obtenerEstadoPresupuestos();
      setAlertas(resumen.alerts);
    } catch (e) {
      setAlertas([]);
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los presupuestos.');
    }
  }, []);

  // Al volver de registrar un gasto el porcentaje cambia, así que se recarga
  // cada vez que el dashboard toma el foco, no solo al montar.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (error) {
    return (
      <View style={estilos.filaError}>
        <Text style={estilos.textoError}>{error}</Text>
        <Pressable onPress={cargar} accessibilityRole="button">
          <Text style={estilos.accion}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  // Sin avisos no hay banner. Devolver null y no una tarjeta vacía.
  if (alertas.length === 0) return null;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>
        {alertas.length === 1 ? 'Alerta de presupuesto' : `Alertas de presupuesto (${alertas.length})`}
      </Text>

      {alertas.map((a) => {
        const nivel = NIVEL[a.status as Exclude<EstadoPresupuesto, 'ok'>] ?? NIVEL.warning;
        // category_name viene null cuando es el presupuesto global del mes.
        const nombre = a.category_name ?? 'Total del mes';
        // El porcentaje pasa de 100 cuando está excedido; la barra se corta
        // en 100 para no desbordar, pero el número de al lado es el real.
        const ancho = Math.min(a.percent_used, 100);

        return (
          <View key={a.id} style={estilos.item}>
            <View style={estilos.itemEncabezado}>
              <Text style={estilos.nombre}>{nombre}</Text>
              <Text style={[estilos.nivel, { color: nivel.color }]}>{nivel.palabra}</Text>
            </View>

            <View style={estilos.barra}>
              <View style={[estilos.barraLlena, { width: `${ancho}%`, backgroundColor: nivel.color }]} />
            </View>

            <Text style={estilos.detalle}>
              {montoConSimbolo(a.spent)} de {montoConSimbolo(a.monthly_limit)} · {Math.round(a.percent_used)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  titulo: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  item: { gap: Spacing.one },
  itemEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  nombre: { flex: 1, fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.texto },
  nivel: { fontSize: FontSize.micro, fontWeight: '700', textTransform: 'uppercase' },
  barra: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.borde,
    overflow: 'hidden',
  },
  barraLlena: { height: '100%', borderRadius: 3 },
  detalle: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  filaError: { gap: Spacing.two },
  textoError: { fontSize: FontSize.etiqueta, color: Palette.gasto },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
});