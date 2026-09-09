/**
 * Presupuestos — la pantalla que le faltaba a HU-11.
 *
 * El backend tenía los presupuestos completos desde el sprint 1, pero no había
 * forma de crear uno desde la app: solo por API. Eso dejaba el titular del
 * dashboard («te queda este mes») invisible para cualquier usuario real, y las
 * alertas de HU-12 sin manera de activarse.
 *
 * DOS COSAS QUE NO SON LO MISMO, y por eso están separadas en la pantalla:
 *
 *   · El presupuesto GENERAL (sin categoría) responde «cuánto me queda para
 *     todo el mes». Es el que manda en el dashboard, y por eso va primero y
 *     solo.
 *   · Los presupuestos POR CATEGORÍA sirven para frenar un rubro concreto.
 *     Son los que disparan las alertas de HU-12.
 *
 * El PUT es upsert por (usuario, categoría), así que la pantalla no lleva la
 * cuenta de si un presupuesto ya existía: guarda y vuelve a leer el estado.
 * Los porcentajes no se calculan acá — vienen de /budgets/status.
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

import {
  eliminarPresupuesto,
  guardarPresupuesto,
  obtenerEstadoPresupuestos,
  type EstadoPresupuesto,
  type PresupuestoConEstado,
} from '@/api/budgets';
import { listarCategorias, type Categoria } from '@/api/categories';
import { ApiError } from '@/api/client';
import { Campo } from '@/components/form';
import { Monto } from '@/components/monto';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { montoConSimbolo } from '@/lib/formato';

/** Palabra + color. La palabra va siempre: el color nunca decide solo. */
const NIVEL: Record<EstadoPresupuesto, { palabra: string; color: string }> = {
  ok: { palabra: 'En orden', color: Palette.ingreso },
  warning: { palabra: 'Cerca del límite', color: Palette.advertencia },
  exceeded: { palabra: 'Excedido', color: Palette.gasto },
};

/** Qué se está editando. `categoryId` null = el general. */
type Edicion = { categoryId: number | null; nombre: string; texto: string };

export default function PresupuestosScreen() {
  const router = useRouter();

  const [presupuestos, setPresupuestos] = useState<PresupuestoConEstado[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargar = useCallback(async (modo: 'inicial' | 'recarga') => {
    if (modo === 'recarga') setRecargando(true);
    else setCargando(true);
    setError(null);
    try {
      const [estado, cats] = await Promise.all([obtenerEstadoPresupuestos(), listarCategorias()]);
      setPresupuestos(estado.budgets);
      setCategorias(cats);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los presupuestos.');
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar('inicial');
    }, [cargar]),
  );

  const general = presupuestos.find((p) => p.category_id === null) ?? null;
  const porCategoria = presupuestos.filter((p) => p.category_id !== null);

  function abrir(categoryId: number | null, nombre: string, actual?: number) {
    setErrorForm(null);
    setEdicion({ categoryId, nombre, texto: actual ? String(Math.round(actual)) : '' });
  }

  async function guardar() {
    if (!edicion) return;
    // Se acepta lo que la persona escriba con puntos o espacios: 380.000,
    // 380 000 y 380000 son el mismo número. Lo que no se acepta es cero o
    // menos, que el backend rechazaría igual pero con un error más feo.
    const limpio = edicion.texto.replace(/[.\s,]/g, '');
    const monto = Number(limpio);
    if (!limpio || Number.isNaN(monto) || monto <= 0) {
      setErrorForm('Escribí un monto mayor a cero.');
      return;
    }
    setGuardando(true);
    setErrorForm(null);
    try {
      await guardarPresupuesto(edicion.categoryId, monto);
      setEdicion(null);
      await cargar('recarga');
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id: number) {
    setGuardando(true);
    try {
      await eliminarPresupuesto(id);
      setEdicion(null);
      await cargar('recarga');
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'No se pudo eliminar.');
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <View style={[estilos.raiz, estilos.centro]}>
        <ActivityIndicator color={Palette.primario} />
      </View>
    );
  }

  return (
    <ScrollView
      style={estilos.raiz}
      contentContainerStyle={estilos.contenido}
      refreshControl={
        <RefreshControl refreshing={recargando} onRefresh={() => cargar('recarga')} />
      }>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={estilos.accion}>‹ Ajustes</Text>
      </Pressable>
      <Text style={estilos.titulo}>Presupuestos</Text>

      {error ? (
        <View style={estilos.tarjeta}>
          <Text style={estilos.errorTexto}>{error}</Text>
          <Pressable onPress={() => cargar('inicial')} accessibilityRole="button">
            <Text style={estilos.accion}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {/* --- el general --- */}
      <Text style={estilos.tituloSeccion}>Presupuesto del mes</Text>
      <View style={estilos.tarjeta}>
        {general ? (
          <>
            <View style={estilos.filaEntre}>
              <Text style={estilos.etiqueta}>Límite mensual</Text>
              <Monto cantidad={general.monthly_limit} variante="fila" />
            </View>
            <View style={estilos.filaEntre}>
              <Text style={estilos.etiqueta}>Te queda</Text>
              <Monto cantidad={general.remaining} variante="fila" />
            </View>
            <Text style={[estilos.estado, { color: NIVEL[general.status].color }]}>
              {NIVEL[general.status].palabra} · {general.percent_used.toFixed(0)} % usado
            </Text>
            <View style={estilos.acciones}>
              <Pressable
                onPress={() => abrir(null, 'del mes', general.monthly_limit)}
                accessibilityRole="button">
                <Text style={estilos.accion}>Cambiar límite</Text>
              </Pressable>
              <Pressable
                onPress={() => quitar(general.id)}
                disabled={guardando}
                accessibilityRole="button">
                <Text style={estilos.accionQuitar}>Quitar</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={estilos.nota}>
              Sin un presupuesto del mes, el inicio muestra tu saldo en vez de cuánto te queda.
            </Text>
            <Pressable onPress={() => abrir(null, 'del mes')} accessibilityRole="button">
              <Text style={estilos.accion}>+ Definir presupuesto del mes</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* --- por categoría --- */}
      <Text style={estilos.tituloSeccion}>Por categoría</Text>
      <Text style={estilos.nota}>
        Opcionales. Sirven para frenar un rubro concreto y son los que disparan las alertas.
      </Text>

      {categorias.length === 0 ? (
        <View style={estilos.tarjeta}>
          <Text style={estilos.nota}>Todavía no hay categorías.</Text>
        </View>
      ) : (
        categorias.map((cat) => {
          const p = porCategoria.find((b) => b.category_id === cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => abrir(cat.id, cat.name, p?.monthly_limit)}
              accessibilityRole="button"
              accessibilityLabel={
                p
                  ? `${cat.name}, límite ${p.monthly_limit} colones, ${NIVEL[p.status].palabra}`
                  : `${cat.name}, sin presupuesto`
              }
              style={({ pressed }) => [estilos.fila, pressed && estilos.filaPresionada]}>
              <View style={estilos.filaTexto}>
                <Text style={estilos.filaNombre}>{cat.name}</Text>
                {p ? (
                  <Text style={[estilos.estado, { color: NIVEL[p.status].color }]}>
                    {NIVEL[p.status].palabra} · {p.percent_used.toFixed(0)} %
                  </Text>
                ) : (
                  <Text style={estilos.nota}>Sin presupuesto</Text>
                )}
              </View>
              {p ? (
                <Monto cantidad={p.monthly_limit} variante="etiqueta" />
              ) : (
                <Text style={estilos.accion}>Definir</Text>
              )}
            </Pressable>
          );
        })
      )}

      {/* --- editor --- */}
      {edicion ? (
        <View style={estilos.editor}>
          <Text style={estilos.tituloSeccion}>Presupuesto {edicion.nombre}</Text>
          <Campo
            etiqueta="Límite mensual en colones"
            value={edicion.texto}
            onChangeText={(t) => setEdicion({ ...edicion, texto: t })}
            placeholder="380 000"
            keyboardType="number-pad"
            editable={!guardando}
            autoFocus
          />
          {edicion.texto ? (
            <Text style={estilos.nota}>
              {montoConSimbolo(Number(edicion.texto.replace(/[.\s,]/g, '')) || 0)} por mes
            </Text>
          ) : null}
          {errorForm ? <Text style={estilos.errorTexto}>{errorForm}</Text> : null}
          <View style={estilos.acciones}>
            <Pressable onPress={guardar} disabled={guardando} accessibilityRole="button">
              <Text style={estilos.accion}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setEdicion(null)}
              disabled={guardando}
              accessibilityRole="button">
              <Text style={estilos.nota}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Palette.fondo },
  centro: { alignItems: 'center', justifyContent: 'center' },
  contenido: {
    padding: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
    maxWidth: 560,
    width: '100%',
    marginHorizontal: 'auto',
  },
  titulo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto, marginBottom: Spacing.two },
  tituloSeccion: {
    fontSize: FontSize.subtitulo,
    fontWeight: '600',
    color: Palette.texto,
    marginTop: Spacing.three,
  },
  tarjeta: {
    gap: Spacing.two,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  editor: {
    gap: Spacing.two,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
    borderWidth: 2,
    borderColor: Palette.primario,
    marginTop: Spacing.three,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  filaPresionada: { opacity: 0.7 },
  filaTexto: { flex: 1, gap: Spacing.half },
  filaNombre: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.texto },
  filaEntre: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  etiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  estado: { fontSize: FontSize.etiqueta, fontWeight: '600' },
  nota: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  acciones: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.one },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
  accionQuitar: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.gasto },
  errorTexto: { fontSize: FontSize.etiqueta, color: Palette.gasto },
});
