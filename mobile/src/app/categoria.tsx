/**
 * Alta y edición de una categoría — HU-08.
 *
 * Con ?id=N edita; sin id, crea. Mismo criterio que movimiento.tsx: es el
 * mismo formulario y separarlo en dos archivos duplicaría la validación.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  actualizarCategoria,
  borrarCategoria,
  crearCategoria,
  listarCategorias,
} from '@/api/categories';
import { ApiError } from '@/api/client';
import { AvisoError, BotonPrimario, Campo } from '@/components/form';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

/** Los nombres que ya usan las categorías por defecto. Todavía no se dibujan. */
const ICONOS = [
  'tag',
  'wallet',
  'restaurant',
  'car',
  'home',
  'bolt',
  'heart',
  'book',
  'movie',
];

export default function CategoriaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = Boolean(id);

  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('tag');
  const [cargando, setCargando] = useState(editando);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let vigente = true;

    (async () => {
      try {
        // El API expone GET /categories/{id}, pero la lista ya está cacheada
        // del lado del servidor y evita un endpoint más en el cliente.
        const cats = await listarCategorias();
        const c = cats.find((x) => String(x.id) === id);
        if (c && vigente) {
          setNombre(c.name);
          setIcono(c.icon);
        }
      } catch (e) {
        if (vigente) {
          setErrorApi(e instanceof ApiError ? e.message : 'No se pudo cargar la categoría.');
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [id]);

  const nombreLimpio = nombre.trim();
  const puedeGuardar = nombreLimpio.length > 0 && !guardando && !cargando;

  async function guardar() {
    setGuardando(true);
    setErrorApi(null);
    try {
      if (id) await actualizarCategoria(Number(id), { name: nombreLimpio, icon: icono });
      else await crearCategoria({ name: nombreLimpio, icon: icono });
      router.back();
    } catch (e) {
      // El 409 por nombre repetido llega aquí con el texto del backend.
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo guardar la categoría.');
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    setGuardando(true);
    setErrorApi(null);
    try {
      await borrarCategoria(Number(id));
      router.back();
    } catch (e) {
      // 409 si la categoría tiene transacciones o un presupuesto asociado.
      setConfirmandoBorrado(false);
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo eliminar la categoría.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={estilos.raiz} contentContainerStyle={estilos.contenido}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={estilos.accion}>Cancelar</Text>
        </Pressable>
      </View>

      <Text style={estilos.titulo}>{editando ? 'Editar categoría' : 'Nueva categoría'}</Text>

      <Campo
        etiqueta="Nombre"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Comida, Transporte…"
        maxLength={80}
        autoCapitalize="sentences"
      />

      <View style={estilos.grupo}>
        <Text style={estilos.etiqueta}>Ícono</Text>
        <View style={estilos.chips}>
          {ICONOS.map((nombreIcono) => {
            const activo = nombreIcono === icono;
            return (
              <Pressable
                key={nombreIcono}
                onPress={() => setIcono(nombreIcono)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                style={[estilos.chip, activo && estilos.chipActivo]}>
                <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>
                  {nombreIcono}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {errorApi ? <AvisoError mensaje={errorApi} /> : null}

      <BotonPrimario onPress={guardar} deshabilitado={!puedeGuardar} cargando={guardando}>
        {editando ? 'Guardar cambios' : 'Crear categoría'}
      </BotonPrimario>

      {editando ? (
        // Confirmación en pantalla y no Alert.alert: React Native Web no
        // implementa Alert, y el borrado se sentiría roto en el build web.
        confirmandoBorrado ? (
          <View style={estilos.confirmar}>
            <Text style={estilos.confirmarTexto}>
              ¿Eliminar «{nombreLimpio}»? No se puede deshacer.
            </Text>
            <View style={estilos.confirmarBotones}>
              <Pressable onPress={() => setConfirmandoBorrado(false)} accessibilityRole="button">
                <Text style={estilos.accion}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={borrar} accessibilityRole="button" disabled={guardando}>
                <Text style={estilos.peligro}>Sí, eliminar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setConfirmandoBorrado(true)}
            accessibilityRole="button"
            style={estilos.borrarFila}>
            <Text style={estilos.peligro}>Eliminar categoría</Text>
          </Pressable>
        )
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Palette.fondo },
  contenido: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  encabezado: { paddingTop: Spacing.two },
  titulo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
  peligro: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.gasto },
  grupo: { gap: Spacing.two },
  etiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
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
  borrarFila: { alignItems: 'center', paddingVertical: Spacing.three },

    confirmar: {
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.gasto,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  confirmarTexto: { fontSize: FontSize.cuerpo, color: Palette.texto },
  confirmarBotones: { flexDirection: 'row', justifyContent: 'space-between' },
});