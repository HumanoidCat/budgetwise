/**
 * Inicio — HU-13. Wireframe: docs/wireframes/03-inicio.svg
 *
 * JERARQUÍA, y el orden no es estético:
 *
 *   1. cuánto queda este mes   ← la única cifra sobre la que se puede actuar hoy
 *   2. avisos de presupuesto
 *   3. el asesor
 *   4. ingresos y gastos del mes
 *   5. recomendaciones
 *   6. gráficos
 *
 * El saldo histórico pasó a segunda línea. Es el número más grande de la base
 * de datos, pero no dice qué hacer: con ₡500 000 de saldo se puede estar
 * perfecto o haberse pasado del presupuesto en la primera semana. Lo que
 * decide si se puede gastar hoy es lo que queda del mes.
 *
 * Si no hay presupuesto general definido no se puede calcular «lo que queda»,
 * así que ahí el saldo vuelve a ser el titular y se invita a crear uno.
 *
 * Nada se calcula acá salvo los días que faltan del mes: los montos, los
 * porcentajes y el estado del presupuesto vienen del backend. Si la pantalla
 * sumara por su cuenta, tarde o temprano diría un número distinto.
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
import {
  obtenerEstadoPresupuestos,
  type PresupuestoConEstado,
  type ResumenPresupuestos,
} from '@/api/budgets';
import { ApiError } from '@/api/client';
import {
  evolucionMensual,
  obtenerResumen,
  type Evolucion,
  type Resumen,
} from '@/api/transactions';
import { AlertaPresupuesto } from '@/components/alerta-presupuesto';
import { GraficoCategorias } from '@/components/grafico-categorias';
import { GraficoMensual } from '@/components/grafico-mensual';
import { Marca } from '@/components/marca';
import { Monto } from '@/components/monto';
import { TarjetaRecomendaciones } from '@/components/tarjeta-recomendaciones';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { mesLargo, montoConSimbolo } from '@/lib/formato';

const MESES_SERIE = 6;
const ALTO_BARRA = 10;

/** Días que faltan para terminar el mes, contando hoy como gastado. */
function diasQueFaltan(): number {
  const hoy = new Date();
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return Math.max(ultimo - hoy.getDate(), 0);
}

export default function InicioScreen() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [evolucion, setEvolucion] = useState<Evolucion | null>(null);
  const [presupuestos, setPresupuestos] = useState<ResumenPresupuestos | null>(null);
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
      // En paralelo: son independientes y así la pantalla no espera el triple.
      // El de presupuestos lleva su propio catch: si /budgets/status falla, el
      // titular cae al saldo, pero el resto de la pantalla se dibuja igual.
      const [r, e, p] = await Promise.all([
        obtenerResumen(),
        evolucionMensual(MESES_SERIE),
        obtenerEstadoPresupuestos().catch(() => null),
      ]);
      setResumen(r);
      setEvolucion(e);
      setPresupuestos(p);
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

  // El presupuesto general es el que no tiene categoría. Es el único que
  // responde «cuánto me queda para todo el mes».
  const general: PresupuestoConEstado | null =
    presupuestos?.budgets.find((b) => b.category_id === null) ?? null;
  const dias = diasQueFaltan();

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
      <View style={estilos.encabezado}>
        <Marca tamano={40} conNombre={false} />
        <View style={estilos.encabezadoTexto}>
          <Text style={estilos.saludo}>{nombre ? `Hola, ${nombre}` : 'Hola'}</Text>
          <Text style={estilos.mes}>{mesLargo(resumen.month.month)}</Text>
        </View>
      </View>

      {/* HU-12: se pinta solo si hay presupuestos en aviso o excedidos. */}
      <AlertaPresupuesto alertas={presupuestos?.alerts} />

      {sinDatos ? (
        <View style={estilos.vacio}>
          <Text style={estilos.vacioTitulo}>Todavía no hay movimientos</Text>
          <Text style={estilos.vacioNota}>
            Registrá tu primer ingreso o gasto y acá vas a ver tu saldo y en qué se te va el mes.
          </Text>
          <Pressable onPress={() => router.push('/movimiento')} accessibilityRole="button">
            <Text style={estilos.accion}>+ Nuevo movimiento</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {general ? (
            <View style={estilos.hero}>
              <Text style={estilos.heroEtiqueta}>Te queda este mes</Text>
              <Monto cantidad={general.remaining} variante="saldo" style={estilos.heroMonto} />
              <Text style={estilos.heroNota}>
                de {montoConSimbolo(general.monthly_limit)} presupuestados
              </Text>

              {/* No se reusa <BarraProgreso> a propósito: esa pinta de VERDE
                  al llegar al 100 %, que es lo correcto para una meta de
                  ahorro y lo contrario para un presupuesto — llegar al 100 %
                  del gasto no es lograrlo, es quedarse sin margen.

                  La barra nunca pasa del 100 %: si se excedió se llena y el
                  dato exacto lo dice el texto de abajo. Una barra desbordada
                  no comunica cuánto se pasó, solo se ve rota. Y el color no va
                  solo: el porcentaje y el estado están escritos debajo. */}
              <View
                style={estilos.barra}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(general.percent_used) }}>
                <View
                  style={[
                    estilos.barraLlena,
                    { width: `${Math.min(general.percent_used, 100)}%` },
                    general.status === 'warning' && estilos.barraAviso,
                    general.status === 'exceeded' && estilos.barraExcedida,
                  ]}
                />
              </View>

              <Text style={estilos.heroNota}>
                {general.percent_used.toFixed(0)} % gastado
                {dias > 0 ? ` · quedan ${dias} ${dias === 1 ? 'día' : 'días'}` : ' · último día del mes'}
              </Text>

              <View style={estilos.heroPie}>
                <Text style={estilos.heroPieEtiqueta}>Saldo actual</Text>
                <Monto cantidad={resumen.balance} variante="etiqueta" />
              </View>
            </View>
          ) : (
            /* Sin presupuesto general no hay «lo que queda» que mostrar, así
               que el saldo vuelve a ser el titular.

               El atajo manda a /presupuestos, que es la pantalla que le
               faltaba a HU-11: sin ella el presupuesto solo se podía crear por
               API y este titular no lo veía nadie. */
            <View style={estilos.hero}>
              <Text style={estilos.heroEtiqueta}>Saldo actual</Text>
              <Monto cantidad={resumen.balance} variante="saldo" style={estilos.heroMonto} />
              <Text style={estilos.heroNota}>
                Definí un presupuesto mensual y acá vas a ver cuánto te queda.
              </Text>
              <Pressable onPress={() => router.push('/presupuestos')} accessibilityRole="button">
                <Text style={estilos.accion}>Definir presupuesto</Text>
              </Pressable>
            </View>
          )}

          <View style={estilos.parEnFila}>
            <View style={[estilos.tarjetaTinte, estilos.mitad, estilos.tinteIngreso]}>
              <Text style={[estilos.etiqueta, { color: Palette.ingreso }]}>Ingresos del mes</Text>
              <Monto cantidad={resumen.month.income} tipo="income" variante="fila" />
            </View>

            <View style={[estilos.tarjetaTinte, estilos.mitad, estilos.tinteGasto]}>
              <Text style={[estilos.etiqueta, { color: Palette.gasto }]}>Gastos del mes</Text>
              <Monto cantidad={resumen.month.expense} tipo="expense" variante="fila" />
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
    // marginHorizontal: 'auto' y no alignSelf: 'center'. En un
    // contentContainerStyle, alignSelf no centra: el contenido se pega a un
    // borde y solo se ve completo al desplazarse. (Bug #52)
    marginHorizontal: 'auto',
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  encabezadoTexto: { flex: 1 },
  saludo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },
  mes: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },

  hero: {
    gap: Spacing.one,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    padding: Spacing.four,
  },
  heroEtiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  heroMonto: { color: Palette.texto, marginBottom: Spacing.half },
  heroNota: { fontSize: FontSize.micro, color: Palette.textoSuave },
  // Pastilla: el radio es la MITAD del alto (regla S0-7). Un radio fijo
  // grande sobre una barra de 10 la convierte en elipse.
  barra: {
    height: ALTO_BARRA,
    borderRadius: Radius.pastilla(ALTO_BARRA),
    backgroundColor: Palette.hundido,
    overflow: 'hidden',
    marginVertical: Spacing.two,
  },
  barraLlena: {
    height: '100%',
    borderRadius: Radius.pastilla(ALTO_BARRA),
    backgroundColor: Palette.primario,
  },
  barraAviso: { backgroundColor: Palette.advertencia },
  barraExcedida: { backgroundColor: Palette.gasto },
  heroPie: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Palette.borde,
  },
  heroPieEtiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },

  tarjetaTinte: { gap: Spacing.two, borderRadius: Radius.tarjeta, padding: Spacing.three },
  tinteIngreso: { backgroundColor: Palette.ingresoSuave },
  tinteGasto: { backgroundColor: Palette.gastoSuave },
  parEnFila: { flexDirection: 'row', gap: Spacing.three },
  mitad: { flex: 1 },
  etiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },

  seccion: {
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  tituloSeccion: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },

  vacio: {
    gap: Spacing.two,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    padding: Spacing.four,
    alignItems: 'center',
  },
  vacioTitulo: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  vacioNota: { fontSize: FontSize.cuerpo, color: Palette.textoSuave, textAlign: 'center' },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
  errorTexto: { fontSize: FontSize.cuerpo, color: Palette.gasto, textAlign: 'center' },
});
