/**
 * Inicio — HU-13. Wireframe: docs/wireframes/03-inicio.svg
 *
 * Saldo, totales del mes y dos gráficos. Todo sale de dos llamadas:
 * GET /transactions/summary y GET /transactions/monthly. Nada se calcula acá:
 * si la pantalla sumara por su cuenta, tarde o temprano diría un saldo
 * distinto al del backend.
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { obtenerRecomendaciones, type Recomendacion } from '@/api/ai';
import { ApiError } from '@/api/client';
import {
  evolucionMensual,
  obtenerResumen,
  type Evolucion,
  type Resumen,
} from '@/api/transactions';
import { GraficoCategorias } from '@/components/grafico-categorias';
import { GraficoMensual } from '@/components/grafico-mensual';
import { TarjetaRecomendaciones } from '@/components/tarjeta-recomendaciones';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { mesLargo, montoConSimbolo } from '@/lib/formato';

const MESES_SERIE = 6;

export default function InicioScreen() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [evolucion, setEvolucion] = useState<Evolucion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Las recomendaciones van en su propio estado y su propia llamada. Dependen
  // de un servicio externo, así que son lo más frágil de la pantalla: si se
  // cargaran junto al resto, un fallo de la IA dejaría al usuario sin ver su
  // saldo.
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [cargandoIA, setCargandoIA] = useState(true);
  const [errorIA, setErrorIA] = useState<string | null>(null);

  const cargarRecomendaciones = useCallback(async () => {
    setCargandoIA(true);
    setErrorIA(null);
    try {
      const r = await obtenerRecomendaciones();
      setRecomendaciones(r.recommendations);
    } catch (err) {
      setErrorIA(
        err instanceof ApiError ? err.message : 'No se pudieron cargar las recomendaciones.',
      );
    } finally {
      setCargandoIA(false);
    }
  }, []);

  const cargar = useCallback(async (modo: 'inicial' | 'recarga') => {
    if (modo === 'recarga') setRecargando(true);
    else setCargando(true);
    setError(null);
    try {
      // En paralelo: son independientes y así la pantalla no espera el doble.
      const [r, e] = await Promise.all([
        obtenerResumen(),
        evolucionMensual(MESES_SERIE),
      ]);
      setResumen(r);
      setEvolucion(e);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el resumen.');
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  // Al volver de registrar un movimiento esta pantalla sigue montada, así que
  // un useEffect no se volvería a ejecutar y el saldo quedaría viejo.
  useFocusEffect(
    useCallback(() => {
      cargar('inicial');
      cargarRecomendaciones();
    }, [cargar, cargarRecomendaciones]),
  );

  if (cargando) {
    return (
      <View style={[estilos.raiz, estilos.centro]}>
        <ActivityIndicator color={Palette.primario} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[estilos.raiz, estilos.centro]}>
        <Text style={estilos.errorTexto}>{error}</Text>
        <Pressable onPress={() => cargar('inicial')} accessibilityRole="button">
          <Text style={estilos.accion}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (!resumen) return null;

  const sinDatos = resumen.total_income === 0 && resumen.total_expense === 0;
  const nombre = usuario?.name?.trim();

  return (
    <ScrollView
      style={estilos.raiz}
      contentContainerStyle={estilos.contenido}
      refreshControl={
        <RefreshControl
          refreshing={recargando}
          onRefresh={() => {
            cargar('recarga');
            cargarRecomendaciones();
          }}
        />
      }>
      <View>
        <Text style={estilos.saludo}>{nombre ? `Hola, ${nombre}` : 'Hola'}</Text>
        <Text style={estilos.mes}>{mesLargo(resumen.month.month)}</Text>
      </View>

      {sinDatos ? (
        <View style={estilos.tarjeta}>
          <Text style={estilos.vacioTitulo}>Todavía no hay nada que resumir</Text>
          <Text style={estilos.vacioNota}>
            Registrá tu primer ingreso o gasto y acá vas a ver tu saldo y en qué se te va el mes.
          </Text>
          <Pressable onPress={() => router.push('/movimiento')} accessibilityRole="button">
            <Text style={estilos.accion}>+ Nuevo movimiento</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Saldo histórico, no el del mes: es el número que la gente busca. */}
          <View style={estilos.tarjeta}>
            <Text style={estilos.etiqueta}>Saldo actual</Text>
            <Text style={estilos.saldo}>{montoConSimbolo(resumen.balance)}</Text>
          </View>

          <View style={estilos.parEnFila}>
            <View style={[estilos.tarjeta, estilos.mitad]}>
              <Text style={estilos.etiqueta}>Ingresos del mes</Text>
              <Text style={[estilos.montoMedio, { color: Palette.ingreso }]}>
                + {montoConSimbolo(resumen.month.income).replace('₡ ', '')}
              </Text>
            </View>

            <View style={[estilos.tarjeta, estilos.mitad]}>
              <Text style={estilos.etiqueta}>Gastos del mes</Text>
              <Text style={[estilos.montoMedio, { color: Palette.gasto }]}>
                - {montoConSimbolo(resumen.month.expense).replace('₡ ', '')}
              </Text>
            </View>
          </View>

          <TarjetaRecomendaciones
            recomendaciones={recomendaciones}
            cargando={cargandoIA}
            error={errorIA}
            alReintentar={cargarRecomendaciones}
          />

          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Gastos por categoría</Text>
            <GraficoCategorias
              porCategoria={resumen.by_category}
              totalGasto={resumen.month.expense}
            />
          </View>

          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Evolución mensual</Text>
            <GraficoMensual meses={evolucion?.months ?? []} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Palette.fondo },
  centro: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  contenido: {
    padding: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  saludo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },
  mes: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  tarjeta: {
    gap: Spacing.two,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  parEnFila: { flexDirection: 'row', gap: Spacing.three },
  mitad: { flex: 1 },
  etiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  saldo: { fontSize: FontSize.monto, fontWeight: '700', color: Palette.texto },
  montoMedio: { fontSize: FontSize.subtitulo, fontWeight: '700' },
  seccion: {
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  tituloSeccion: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  vacioTitulo: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  vacioNota: { fontSize: FontSize.cuerpo, color: Palette.textoSuave },
  errorTexto: { fontSize: FontSize.cuerpo, color: Palette.gasto, textAlign: 'center' },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
});
