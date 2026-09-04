/**
 * Movimientos — HU-07. Wireframe: docs/wireframes/04-movimientos.svg
 *
 * Lista de ingresos y gastos, de la más reciente a la más antigua, agrupada
 * por día y con filtro por tipo.
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/api/client';
import {
  listarMovimientos,
  type Movimiento,
  type TipoMovimiento,
} from '@/api/transactions';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { etiquetaFecha, montoConSigno } from '@/lib/formato';

const POR_PAGINA = 50;

const FILTROS: { etiqueta: string; valor: TipoMovimiento | undefined }[] = [
  { etiqueta: 'Todos', valor: undefined },
  { etiqueta: 'Ingresos', valor: 'income' },
  { etiqueta: 'Gastos', valor: 'expense' },
];

type Seccion = { title: string; data: Movimiento[] };

/** Agrupa por día conservando el orden que ya trae el backend. */
function agrupar(items: Movimiento[]): Seccion[] {
  const secciones: Seccion[] = [];
  for (const m of items) {
    const titulo = etiquetaFecha(m.date);
    const ultima = secciones[secciones.length - 1];
    if (ultima && ultima.title === titulo) ultima.data.push(m);
    else secciones.push({ title: titulo, data: [m] });
  }
  return secciones;
}

export default function MovimientosScreen() {
  const router = useRouter();

  const [tipo, setTipo] = useState<TipoMovimiento | undefined>(undefined);
  const [items, setItems] = useState<Movimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [trayendoMas, setTrayendoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (filtro: TipoMovimiento | undefined, modo: 'inicial' | 'recarga') => {
      if (modo === 'recarga') setRecargando(true);
      else setCargando(true);
      setError(null);
      try {
        const r = await listarMovimientos({ type: filtro, limit: POR_PAGINA, offset: 0 });
        setItems(r.items);
        setTotal(r.total);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los movimientos.');
      } finally {
        setCargando(false);
        setRecargando(false);
      }
    },
    [],
  );

  // useFocusEffect y no useEffect: al volver del formulario esta pantalla
  // sigue montada, así que un useEffect no se vuelve a ejecutar y la lista
  // quedaría mostrando datos viejos — sin el movimiento recién creado.
  useFocusEffect(
    useCallback(() => {
      cargar(tipo, 'inicial');
    }, [tipo, cargar]),
  );

  async function traerMas() {
    // `total` es el conteo con filtros y sin paginar: sirve para saber si falta.
    if (trayendoMas || items.length >= total) return;
    setTrayendoMas(true);
    try {
      const r = await listarMovimientos({ type: tipo, limit: POR_PAGINA, offset: items.length });
      setItems((previos) => [...previos, ...r.items]);
      setTotal(r.total);
    } catch {
      // Un fallo al paginar no debe borrar lo que ya se está viendo.
    } finally {
      setTrayendoMas(false);
    }
  }

  const secciones = useMemo(() => agrupar(items), [items]);

  return (
    <View style={estilos.raiz}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Movimientos</Text>
        <Pressable onPress={() => router.push('/movimiento')} accessibilityRole="button">
          <Text style={estilos.accion}>+ Nuevo</Text>
        </Pressable>
      </View>

      <View style={estilos.filtros}>
        {FILTROS.map((f) => {
          const activo = f.valor === tipo;
          return (
            <Pressable
              key={f.etiqueta}
              onPress={() => setTipo(f.valor)}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              style={[estilos.chip, activo && estilos.chipActivo]}>
              <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>
                {f.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator color={Palette.primario} />
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.errorTexto}>{error}</Text>
          <Pressable onPress={() => cargar(tipo, 'inicial')} accessibilityRole="button">
            <Text style={estilos.accion}>Reintentar</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={estilos.centro}>
          <Text style={estilos.vacioTitulo}>Todavía no hay movimientos</Text>
          <Text style={estilos.vacioNota}>
            {tipo ? 'Probá quitando el filtro.' : 'Registrá el primero para ver tu saldo.'}
          </Text>
          <Pressable onPress={() => router.push('/movimiento')} accessibilityRole="button">
            <Text style={estilos.accion}>+ Nuevo movimiento</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={estilos.lista}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={recargando} onRefresh={() => cargar(tipo, 'recarga')} />
          }
          onEndReached={traerMas}
          onEndReachedThreshold={0.4}
          renderSectionHeader={({ section }) => (
            <Text style={estilos.seccion}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/movimiento?id=${item.id}`)}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.fila, pressed && estilos.filaPresionada]}>
              <View style={estilos.filaTexto}>
                <Text style={estilos.filaCategoria}>{item.category_name ?? 'Sin categoría'}</Text>
                {item.description ? (
                  <Text style={estilos.filaDescripcion} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text
                style={[
                  estilos.filaMonto,
                  { color: item.type === 'income' ? Palette.ingreso : Palette.gasto },
                ]}>
                {montoConSigno(item.amount, item.type)}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            trayendoMas ? (
              <ActivityIndicator style={estilos.pie} color={Palette.primario} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Palette.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
  },
  titulo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
  filtros: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.borde,
    backgroundColor: Palette.superficie,
  },
  chipActivo: { backgroundColor: Palette.primarioSuave, borderColor: Palette.primarioSuave },
  chipTexto: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  chipTextoActivo: { color: Palette.primario, fontWeight: '600' },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  vacioTitulo: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  vacioNota: { fontSize: FontSize.cuerpo, color: Palette.textoSuave, textAlign: 'center' },
  errorTexto: { fontSize: FontSize.cuerpo, color: Palette.gasto, textAlign: 'center' },
  lista: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  seccion: {
    fontSize: FontSize.micro,
    fontWeight: '600',
    color: Palette.textoSuave,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  filaPresionada: { opacity: 0.7 },
  filaTexto: { flex: 1, gap: 2 },
  filaCategoria: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.texto },
  filaDescripcion: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  filaMonto: { fontSize: FontSize.subtitulo, fontWeight: '700' },
  pie: { marginVertical: Spacing.three },
});
