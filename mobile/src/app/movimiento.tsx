/**
 * Alta y edición de un movimiento — HU-07.
 * Wireframe: docs/wireframes/05-movimiento-alta.svg
 *
 * Una sola pantalla para las dos cosas. Con ?id=N carga el movimiento y lo
 * edita; sin id, crea uno nuevo. Son el mismo formulario con los mismos
 * campos, y separarlos en dos archivos duplicaría toda la validación.
 *
 * Vive fuera de (tabs) a propósito: se abre encima y no lleva barra inferior.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { listarCategorias, type Categoria } from '@/api/categories';
import { ApiError } from '@/api/client';
import {
  actualizarMovimiento,
  borrarMovimiento,
  crearMovimiento,
  listarMovimientos,
  type Movimiento,
  type TipoMovimiento,
} from '@/api/transactions';
import { CampoFecha } from '@/components/campo-fecha';
import { AvisoError, BotonPrimario } from '@/components/form';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { fechaValida, hoyISO } from '@/lib/formato';

export default function MovimientoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = Boolean(id);

  const [tipo, setTipo] = useState<TipoMovimiento>('expense');
  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(hoyISO());
  const [nota, setNota] = useState('');

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [tocado, setTocado] = useState({ monto: false, fecha: false });

  // Categorías, y el movimiento si se está editando.
  useEffect(() => {
    let vigente = true;

    (async () => {
      try {
        const cats = await listarCategorias();
        if (vigente) setCategorias(cats);

        if (id) {
          // El API no expone GET /transactions/{id} sin auth extra, pero sí la
          // lista; se busca ahí para no depender de un endpoint distinto.
          const r = await listarMovimientos({ limit: 200 });
          const m: Movimiento | undefined = r.items.find((x) => String(x.id) === id);
          if (m && vigente) {
            setTipo(m.type);
            setMonto(String(m.amount));
            setCategoriaId(m.category_id);
            setFecha(m.date);
            setNota(m.description);
          }
        }
      } catch (e) {
        if (vigente) {
          setErrorApi(e instanceof ApiError ? e.message : 'No se pudo cargar la información.');
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [id]);

  const montoNumero = Number(monto.replace(',', '.'));
  const montoOk = monto.trim() !== '' && Number.isFinite(montoNumero) && montoNumero > 0;
  const fechaOk = fechaValida(fecha);
  const valido = montoOk && fechaOk;

  const errorMonto =
    tocado.monto && !montoOk ? 'Escribí un monto mayor a cero.' : null;
  const errorFecha =
    tocado.fecha && !fechaOk ? 'Revisá la fecha: tiene que ser año-mes-día.' : null;

  async function guardar() {
    if (!valido || guardando) return;
    setErrorApi(null);
    setGuardando(true);
    try {
      const datos = {
        type: tipo,
        amount: montoNumero,
        date: fecha,
        category_id: categoriaId,
        description: nota.trim(),
      };
      if (id) await actualizarMovimiento(Number(id), datos);
      else await crearMovimiento(datos);
      router.back();
    } catch (e) {
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo guardar el movimiento.');
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    try {
      await borrarMovimiento(Number(id));
      router.back();
    } catch (e) {
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo borrar.');
    }
  }

  function confirmarBorrado() {
    // Borrar es irreversible y el API no ofrece deshacer, así que se pregunta.
    //
    // Alert.alert NO hace nada en web: en React Native Web es una función
    // vacía. Sin esta bifurcación, en el navegador el botón de borrar no
    // mostraría nada y tampoco borraría, en silencio.
    const mensaje = '¿Borrar este movimiento? Esta acción no se puede deshacer.';

    if (Platform.OS === 'web') {
      if (window.confirm(mensaje)) borrar();
      return;
    }

    Alert.alert('Borrar movimiento', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: borrar },
    ]);
  }

  if (cargando) {
    return (
      <View style={[estilos.raiz, estilos.centro]}>
        <ActivityIndicator color={Palette.primario} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>{editando ? 'Editar movimiento' : 'Nuevo movimiento'}</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={estilos.accion}>Cerrar</Text>
          </Pressable>
        </View>

        {/* Tipo. Con palabras y no solo con color: el color nunca va solo. */}
        <View style={estilos.grupo}>
          <Text style={estilos.etiqueta}>Tipo</Text>
          <View style={estilos.segmentos}>
            {(['expense', 'income'] as TipoMovimiento[]).map((t) => {
              const activo = tipo === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTipo(t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  style={[estilos.segmento, activo && estilos.segmentoActivo]}>
                  <Text style={[estilos.segmentoTexto, activo && estilos.segmentoTextoActivo]}>
                    {t === 'expense' ? 'Gasto' : 'Ingreso'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Monto */}
        <View style={estilos.grupo}>
          <Text style={estilos.etiqueta}>Monto</Text>
          <View style={[estilos.montoCaja, errorMonto && estilos.cajaError]}>
            <Text style={estilos.simbolo}>₡</Text>
            <TextInput
              value={monto}
              onChangeText={setMonto}
              onBlur={() => setTocado((t) => ({ ...t, monto: true }))}
              placeholder="0"
              placeholderTextColor={Palette.deshabilitado}
              keyboardType="decimal-pad"
              editable={!guardando}
              accessibilityLabel="Monto"
              aria-invalid={Boolean(errorMonto)}
              style={[
                estilos.montoEntrada,
                { color: tipo === 'income' ? Palette.ingreso : Palette.gasto },
              ]}
            />
          </View>
          {errorMonto ? <Text style={estilos.textoError}>{errorMonto}</Text> : null}
        </View>

        {/* Categoría */}
        <View style={estilos.grupo}>
          <Text style={estilos.etiqueta}>Categoría</Text>
          <View style={estilos.chips}>
            <Pressable
              onPress={() => setCategoriaId(null)}
              accessibilityRole="button"
              accessibilityState={{ selected: categoriaId === null }}
              style={[estilos.chip, categoriaId === null && estilos.chipActivo]}>
              <Text
                style={[estilos.chipTexto, categoriaId === null && estilos.chipTextoActivo]}>
                Sin categoría
              </Text>
            </Pressable>

            {categorias.map((c) => {
              const activo = categoriaId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoriaId(c.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  style={[estilos.chip, activo && estilos.chipActivo]}>
                  <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <CampoFecha
          valor={fecha}
          alCambiar={(v) => {
            setFecha(v);
            setTocado((t) => ({ ...t, fecha: true }));
          }}
          error={errorFecha}
          editable={!guardando}
        />

        {/* Nota */}
        <View style={estilos.grupo}>
          <Text style={estilos.etiqueta}>Nota</Text>
          <TextInput
            value={nota}
            onChangeText={setNota}
            placeholder="Opcional"
            placeholderTextColor={Palette.deshabilitado}
            maxLength={255}
            editable={!guardando}
            accessibilityLabel="Nota"
            style={estilos.entrada}
          />
        </View>

        {errorApi ? <AvisoError mensaje={errorApi} /> : null}

        {/* El botón es azul aunque el monto esté en rojo o verde: si fuera
            verde, el mismo verde significaría "ingreso" y "guardar". */}
        <BotonPrimario onPress={guardar} deshabilitado={!valido} cargando={guardando}>
          {editando ? 'Guardar cambios' : 'Guardar movimiento'}
        </BotonPrimario>

        {editando ? (
          <Pressable onPress={confirmarBorrado} accessibilityRole="button">
            <Text style={estilos.borrar}>Borrar movimiento</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Palette.fondo },
  centro: { alignItems: 'center', justifyContent: 'center' },
  contenido: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  titulo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
  grupo: { gap: Spacing.two },
  etiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  segmentos: {
    flexDirection: 'row',
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.campo,
    padding: 3,
    gap: 3,
  },
  segmento: { flex: 1, paddingVertical: Spacing.two + 2, borderRadius: 8, alignItems: 'center' },
  segmentoActivo: { backgroundColor: Palette.primarioSuave },
  segmentoTexto: { fontSize: FontSize.cuerpo, color: Palette.textoSuave },
  segmentoTextoActivo: { color: Palette.primario, fontWeight: '700' },
  montoCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 64,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Palette.bordeCampo,
    borderRadius: Radius.campo,
    backgroundColor: Palette.superficie,
  },
  cajaError: { borderColor: Palette.gasto },
  simbolo: { fontSize: 20, color: Palette.textoSuave },
  montoEntrada: { flex: 1, fontSize: FontSize.monto, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Palette.borde,
    backgroundColor: Palette.superficie,
  },
  chipActivo: { backgroundColor: Palette.primarioSuave, borderColor: Palette.primarioSuave },
  chipTexto: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  chipTextoActivo: { color: Palette.primario, fontWeight: '600' },
  entrada: {
    height: 48,
    borderWidth: 1,
    borderColor: Palette.bordeCampo,
    borderRadius: Radius.campo,
    paddingHorizontal: Spacing.three,
    fontSize: FontSize.cuerpo,
    color: Palette.texto,
    backgroundColor: Palette.superficie,
  },
  textoError: { fontSize: FontSize.etiqueta, color: Palette.gasto },
  borrar: {
    textAlign: 'center',
    fontSize: FontSize.cuerpo,
    fontWeight: '600',
    color: Palette.gasto,
    paddingVertical: Spacing.three,
  },
});
