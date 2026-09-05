/**
 * Categorías — HU-08.
 *
 * Sin wireframe propio en S0-7: la pantalla se arma con el sistema visual y
 * sigue la estructura de movimientos.tsx. Se llega desde Ajustes, que ya la
 * anunciaba ("Perfil, moneda, categorias y cierre de sesion").
 *
 * Vive fuera de (tabs) porque es una pantalla secundaria: administrar
 * categorías es una tarea ocasional, no algo de uso diario.
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

import { listarCategorias, type Categoria } from '@/api/categories';
import { ApiError } from '@/api/client';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

export default function CategoriasScreen() {
  const router = useRouter();

  const [items, setItems] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (modo: 'inicial' | 'recarga') => {
    if (modo === 'recarga') setRecargando(true);
    else setCargando(true);
    setError(null);
    try {
      setItems(await listarCategorias());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las categorías.');
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  // useFocusEffect y no useEffect: al volver del formulario esta pantalla
  // sigue montada, y con useEffect la lista mostraría datos viejos.
  useFocusEffect(
    useCallback(() => {
      cargar('inicial');
    }, [cargar]),
  );

  return (
    <View style={estilos.raiz}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={estilos.accion}>‹ Ajustes</Text>
        </Pressable>
      </View>

      <View style={estilos.tituloFila}>
        <Text style={estilos.titulo}>Categorías</Text>
        <Pressable onPress={() => router.push('/categoria')} accessibilityRole="button">
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
      ) : items.length === 0 ? (
        <View style={estilos.centro}>
          <Text style={estilos.vacioTitulo}>No hay categorías</Text>
          <Text style={estilos.vacioNota}>
            Al crear tu cuenta se agregan nueve por defecto. Si no ves ninguna, revisá tu conexión.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={recargando} onRefresh={() => cargar('recarga')} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/categoria?id=${item.id}`)}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.fila, pressed && estilos.filaPresionada]}>
              <View style={estilos.filaTexto}>
                <Text style={estilos.filaNombre}>{item.name}</Text>
                <Text style={estilos.filaIcono}>{item.icon}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Palette.fondo },
  encabezado: { paddingHorizontal: Spacing.three, paddingTop: Spacing.five },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
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
  filaNombre: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.texto },
  filaIcono: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
});