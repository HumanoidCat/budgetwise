/**
 * Metas — HU-10b. Wireframe: docs/wireframes/06-metas.svg
 *
 * Lista de metas de ahorro con su avance, de mayor a menor progreso. El orden
 * y el porcentaje los calcula el API (GET /goals), no esta pantalla: así la
 * barra siempre coincide con lo que dice el servidor.
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/api/client';
import { listarMetas, type Meta } from '@/api/goals';
import { BarraProgreso } from '@/components/barra-progreso';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { montoConSimbolo } from '@/lib/formato';

export default function MetasScreen() {
  const router = useRouter();

  const [metas, setMetas] = useState<Meta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (modo: 'inicial' | 'recarga') => {
    if (modo === 'recarga') setRecargando(true);
    else setCargando(true);
    setError(null);
    try {
      setMetas(await listarMetas());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las metas.');
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  // useFocusEffect y no useEffect: al volver del formulario o de registrar un
  // aporte esta pantalla sigue montada, así que un useEffect no se volvería a
  // ejecutar y el avance quedaría mostrando el valor viejo.
  useFocusEffect(
    useCallback(() => {
      cargar('inicial');
    }, [cargar]),
  );

  return (
    <View style={estilos.raiz}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Metas</Text>
        <Pressable onPress={() => router.push('/meta')} accessibilityRole="button">
          <Text style={estilos.accion}>+ Nueva</Text>
        </Pressable>
      </View>

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator color={Palette.primario} />
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.errorTexto}>{error}</Text>
          <Pressable onPress={() => cargar('inicial')} accessibilityRole="button">
            <Text style={estilos.accion}>Reintentar</Text>
          </Pressable>
        </View>
      ) : metas.length === 0 ? (
        <View style={estilos.centro}>
          <Text style={estilos.vacioTitulo}>Todavía no tenés metas</Text>
          <Text style={estilos.vacioNota}>
            Definí cuánto querés juntar y llevá el avance desde acá.
          </Text>
          <Pressable onPress={() => router.push('/meta')} accessibilityRole="button">
            <Text style={estilos.accion}>+ Nueva meta</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={metas}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={recargando} onRefresh={() => cargar('recarga')} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/meta?id=${item.id}`)}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.tarjeta, pressed && estilos.tarjetaPresionada]}>
              <View style={estilos.filaTitulo}>
                <Text style={estilos.nombre} numberOfLines={1}>
                  {item.name}
                </Text>
                {/* El porcentaje va siempre como texto: la barra sola no se lee
                    sin distinguir colores. Y muestra el valor real, que puede
                    pasar de 100 aunque la barra se recorte. */}
                <Text style={[estilos.porcentaje, item.completed && estilos.porcentajeListo]}>
                  {Math.round(item.progress)} %
                </Text>
              </View>

              <BarraProgreso porcentaje={item.progress} />

              <Text style={estilos.montos}>
                {montoConSimbolo(item.saved_amount)} de {montoConSimbolo(item.target_amount)}
              </Text>
            </Pressable>
          )}
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
    paddingBottom: Spacing.three,
  },
  titulo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
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
  tarjeta: {
    gap: Spacing.two,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  tarjetaPresionada: { opacity: 0.7 },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  nombre: { flex: 1, fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  porcentaje: { fontSize: FontSize.subtitulo, fontWeight: '700', color: Palette.primario },
  porcentajeListo: { color: Palette.ingreso },
  montos: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
});
