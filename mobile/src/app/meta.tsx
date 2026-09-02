/**
 * Alta, edición y aportes de una meta — HU-10b.
 * Wireframe: docs/wireframes/06-metas.svg
 *
 * Una sola pantalla para las tres cosas. Con ?id=N carga la meta, muestra su
 * avance y permite registrar aportes; sin id, crea una nueva.
 *
 * Vive fuera de (tabs) a propósito: se abre encima y no lleva barra inferior,
 * igual que app/movimiento.tsx.
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
  View,
} from 'react-native';

import { ApiError } from '@/api/client';
import {
  actualizarMeta,
  aportarAMeta,
  borrarMeta,
  crearMeta,
  obtenerMeta,
  type Meta,
} from '@/api/goals';
import { BarraProgreso } from '@/components/barra-progreso';
import { AvisoError, BotonPrimario, Campo } from '@/components/form';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { fechaValida, montoConSimbolo } from '@/lib/formato';

/** Acepta coma o punto como separador decimal. */
function aNumero(texto: string): number {
  return Number(texto.replace(',', '.'));
}

export default function MetaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = Boolean(id);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [nombre, setNombre] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [aporte, setAporte] = useState('');

  const [cargando, setCargando] = useState(editando);
  const [guardando, setGuardando] = useState(false);
  const [aportando, setAportando] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [tocado, setTocado] = useState({ nombre: false, objetivo: false, fecha: false });

  useEffect(() => {
    if (!id) return;
    let vigente = true;

    (async () => {
      try {
        const encontrada = await obtenerMeta(Number(id));
        if (!vigente) return;
        setMeta(encontrada);
        setNombre(encontrada.name);
        setObjetivo(String(encontrada.target_amount));
        setFechaLimite(encontrada.due_date ?? '');
      } catch (e) {
        if (vigente) {
          setErrorApi(e instanceof ApiError ? e.message : 'No se pudo cargar la meta.');
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [id]);

  const objetivoNumero = aNumero(objetivo);
  const nombreOk = nombre.trim() !== '';
  const objetivoOk = objetivo.trim() !== '' && Number.isFinite(objetivoNumero) && objetivoNumero > 0;
  // La fecha límite es opcional: vacía es válida y significa "sin fecha".
  const fechaOk = fechaLimite.trim() === '' || fechaValida(fechaLimite.trim());
  const valido = nombreOk && objetivoOk && fechaOk;

  const aporteNumero = aNumero(aporte);
  const aporteOk = aporte.trim() !== '' && Number.isFinite(aporteNumero) && aporteNumero > 0;

  async function guardar() {
    if (!valido || guardando) return;
    setErrorApi(null);
    setGuardando(true);
    try {
      const datos = {
        name: nombre.trim(),
        target_amount: objetivoNumero,
        // Cadena vacía no es una fecha: se manda null, que el API entiende
        // como "quitar la fecha límite".
        due_date: fechaLimite.trim() === '' ? null : fechaLimite.trim(),
      };
      if (id) await actualizarMeta(Number(id), datos);
      else await crearMeta(datos);
      router.back();
    } catch (e) {
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo guardar la meta.');
    } finally {
      setGuardando(false);
    }
  }

  async function registrarAporte() {
    if (!aporteOk || aportando || !id) return;
    setErrorApi(null);
    setAportando(true);
    try {
      // El API devuelve la meta con el avance ya recalculado, así que se pinta
      // lo que respondió el servidor en vez de sumar el aporte en la pantalla.
      setMeta(await aportarAMeta(Number(id), aporteNumero));
      setAporte('');
    } catch (e) {
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo registrar el aporte.');
    } finally {
      setAportando(false);
    }
  }

  async function borrar() {
    try {
      await borrarMeta(Number(id));
      router.back();
    } catch (e) {
      setErrorApi(e instanceof ApiError ? e.message : 'No se pudo borrar la meta.');
    }
  }

  function confirmarBorrado() {
    // Alert.alert no hace nada en React Native Web: sin esta bifurcación, en el
    // navegador el botón no mostraría nada y tampoco borraría, en silencio.
    const mensaje = '¿Borrar esta meta? Se pierde el avance registrado.';

    if (Platform.OS === 'web') {
      if (window.confirm(mensaje)) borrar();
      return;
    }

    Alert.alert('Borrar meta', mensaje, [
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
          <Text style={estilos.titulo}>{editando ? 'Editar meta' : 'Nueva meta'}</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={estilos.accion}>Cerrar</Text>
          </Pressable>
        </View>

        {meta ? (
          <View style={estilos.avance}>
            <View style={estilos.filaAvance}>
              <Text style={estilos.avanceEtiqueta}>Avance</Text>
              <Text style={[estilos.porcentaje, meta.completed && estilos.porcentajeListo]}>
                {Math.round(meta.progress)} %
              </Text>
            </View>
            <BarraProgreso porcentaje={meta.progress} />
            <Text style={estilos.montos}>
              {montoConSimbolo(meta.saved_amount)} de {montoConSimbolo(meta.target_amount)}
            </Text>
            <Text style={estilos.montos}>
              {meta.completed
                ? '¡Meta alcanzada!'
                : `Faltan ${montoConSimbolo(meta.remaining)}`}
            </Text>
          </View>
        ) : null}

        <Campo
          etiqueta="Nombre"
          value={nombre}
          onChangeText={setNombre}
          onBlur={() => setTocado((t) => ({ ...t, nombre: true }))}
          placeholder="Fondo de emergencia"
          error={tocado.nombre && !nombreOk ? 'Ponele un nombre a la meta.' : null}
        />

        <Campo
          etiqueta="Monto objetivo"
          value={objetivo}
          onChangeText={setObjetivo}
          onBlur={() => setTocado((t) => ({ ...t, objetivo: true }))}
          keyboardType="decimal-pad"
          placeholder="1000000"
          error={tocado.objetivo && !objetivoOk ? 'Escribí un monto mayor a cero.' : null}
        />

        <Campo
          etiqueta="Fecha límite (opcional)"
          value={fechaLimite}
          onChangeText={setFechaLimite}
          onBlur={() => setTocado((t) => ({ ...t, fecha: true }))}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="2026-12-31"
          ayuda="Formato año-mes-día. Dejala vacía si no tiene fecha."
          error={tocado.fecha && !fechaOk ? 'Revisá la fecha: tiene que ser año-mes-día.' : null}
        />

        {errorApi ? <AvisoError mensaje={errorApi} /> : null}

        <BotonPrimario onPress={guardar} deshabilitado={!valido} cargando={guardando}>
          {editando ? 'Guardar cambios' : 'Crear meta'}
        </BotonPrimario>

        {editando && meta ? (
          <View style={estilos.seccionAporte}>
            <Text style={estilos.seccionTitulo}>Registrar aporte</Text>
            <Text style={estilos.seccionNota}>
              Se suma a lo ahorrado. Escribí cuánto aportás, no el total.
            </Text>

            <Campo
              etiqueta="Monto del aporte"
              value={aporte}
              onChangeText={setAporte}
              keyboardType="decimal-pad"
              placeholder="20000"
            />

            <BotonPrimario
              onPress={registrarAporte}
              deshabilitado={!aporteOk}
              cargando={aportando}>
              Aportar
            </BotonPrimario>
          </View>
        ) : null}

        {editando ? (
          <Pressable onPress={confirmarBorrado} accessibilityRole="button" style={estilos.borrar}>
            <Text style={estilos.borrarTexto}>Borrar meta</Text>
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
    gap: Spacing.three,
    padding: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: { fontSize: FontSize.titulo, fontWeight: '700', color: Palette.texto },
  accion: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.primario },
  avance: {
    gap: Spacing.two,
    backgroundColor: Palette.superficie,
    borderWidth: 1,
    borderColor: Palette.borde,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  filaAvance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avanceEtiqueta: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  porcentaje: { fontSize: FontSize.subtitulo, fontWeight: '700', color: Palette.primario },
  porcentajeListo: { color: Palette.ingreso },
  montos: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  seccionAporte: {
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Palette.borde,
    paddingTop: Spacing.four,
  },
  seccionTitulo: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  seccionNota: { fontSize: FontSize.etiqueta, color: Palette.textoSuave },
  borrar: { alignItems: 'center', paddingVertical: Spacing.three },
  borrarTexto: { fontSize: FontSize.cuerpo, fontWeight: '600', color: Palette.gasto },
});
