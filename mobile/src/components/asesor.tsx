/**
 * Asesor — la pregunta en español, la respuesta anclada a los datos.
 *
 * Es lo que HU-14 no hacía: aquella tarjeta habla sin que le pregunten y con
 * reglas fijas. Esta contesta lo que la persona escribió.
 *
 * TRES DECISIONES DE DISEÑO QUE NO SON DECORATIVAS
 *
 * 1. Las cifras se muestran DEBAJO de la respuesta, siempre. El asesor enseña
 *    de dónde sacó el número. Es lo que separa un consejo de una adivinanza, y
 *    de paso deja verificable que el modelo no inventó nada.
 *
 * 2. El veredicto lleva PALABRA, no solo color: «Alcanza» / «Justo» /
 *    «No alcanza». Misma regla de S0-7 — el 8 % de los hombres no distingue
 *    rojo de verde, y acá el color decidiría una compra.
 *
 * 3. Las sugerencias son botones, no texto de ayuda. Una pantalla en blanco
 *    con un campo vacío es la forma más rápida de que nadie use la función:
 *    la persona no sabe qué se le puede preguntar hasta que ve un ejemplo.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { preguntarAlAsesor, type RespuestaAsesor, type Veredicto } from '@/api/asesor';
import { ApiError } from '@/api/client';
import { FontSize, Palette, Radius, Spacing, Tipografia } from '@/constants/theme';
import { montoConSimbolo } from '@/lib/formato';

/** El veredicto se comunica con palabra + color, nunca con color solo. */
function etiquetaVeredicto(v: Veredicto): { palabra: string; color: string } {
  if (!v.alcanza) return { palabra: 'No alcanza', color: Palette.gasto };
  if (v.justo) return { palabra: 'Alcanza justo', color: Palette.advertencia };
  return { palabra: 'Alcanza', color: Palette.ingreso };
}

const EJEMPLOS = [
  '¿Me alcanza para unos tenis de 45 mil?',
  '¿En qué se me va la plata?',
  '¿Cómo voy con el presupuesto?',
];

export function Asesor() {
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RespuestaAsesor | null>(null);

  async function preguntar(pregunta: string) {
    const limpia = pregunta.trim();
    if (limpia.length < 2 || cargando) return;
    setCargando(true);
    setError(null);
    try {
      setResultado(await preguntarAlAsesor(limpia));
      setTexto('');
    } catch (e) {
      // Render duerme a los 15 minutos: la primera pregunta del día puede
      // tardar o fallar. El mensaje del ApiError ya viene legible.
      setError(e instanceof ApiError ? e.message : 'No se pudo consultar al asesor.');
    } finally {
      setCargando(false);
    }
  }

  const sugerencias = resultado?.sugerencias?.length ? resultado.sugerencias : EJEMPLOS;
  const ctx = resultado?.contexto;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Preguntale a tu plata</Text>
        {resultado?.source === 'llm' && (
          <Text style={estilos.insignia} accessibilityLabel="Respuesta redactada por la IA">
            IA
          </Text>
        )}
      </View>

      <View style={estilos.campoFila}>
        <TextInput
          style={estilos.campo}
          value={texto}
          onChangeText={setTexto}
          placeholder="¿Me alcanza para…?"
          placeholderTextColor={Palette.deshabilitado}
          maxLength={300}
          returnKeyType="send"
          editable={!cargando}
          onSubmitEditing={() => preguntar(texto)}
          accessibilityLabel="Escribí tu pregunta sobre tus finanzas"
        />
        <Pressable
          style={[estilos.boton, (cargando || texto.trim().length < 2) && estilos.botonInactivo]}
          disabled={cargando || texto.trim().length < 2}
          onPress={() => preguntar(texto)}
          accessibilityRole="button"
          accessibilityLabel="Preguntar"
        >
          {cargando ? (
            <ActivityIndicator color={Palette.primarioTexto} />
          ) : (
            <Text style={estilos.botonTexto}>Preguntar</Text>
          )}
        </Pressable>
      </View>

      {error && (
        <View style={estilos.error}>
          <Text style={estilos.errorTexto}>{error}</Text>
          <Pressable onPress={() => preguntar(resultado?.pregunta ?? texto)}>
            <Text style={estilos.reintentar}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {resultado && !error && (
        <View style={estilos.respuestaBloque}>
          {resultado.veredicto && (
            <Text
              style={[estilos.veredicto, { color: etiquetaVeredicto(resultado.veredicto).color }]}
            >
              {etiquetaVeredicto(resultado.veredicto).palabra}
            </Text>
          )}
          <Text style={estilos.respuesta}>{resultado.respuesta}</Text>

          {/* Las cifras que sostienen la respuesta. No es adorno: es la prueba. */}
          {ctx && (
            <View style={estilos.cifras}>
              <Cifra etiqueta="Te queda" valor={montoConSimbolo(ctx.disponible)} />
              <Cifra etiqueta="Gastado" valor={montoConSimbolo(ctx.gastos)} />
              <Cifra etiqueta="Por día" valor={montoConSimbolo(ctx.disponible_por_dia)} />
              <Cifra etiqueta="Días" valor={String(ctx.dias_restantes)} />
            </View>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chips}>
        {sugerencias.map((s) => (
          <Pressable
            key={s}
            style={estilos.chip}
            onPress={() => preguntar(s)}
            accessibilityRole="button"
          >
            <Text style={estilos.chipTexto}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.cifra}>
      <Text style={estilos.cifraEtiqueta}>{etiqueta}</Text>
      <Text style={estilos.cifraValor}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: Palette.superficie,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: FontSize.subtitulo, fontWeight: '600', color: Palette.texto },
  insignia: {
    fontSize: FontSize.micro,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Palette.primarioTexto,
    backgroundColor: Palette.primario,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pastilla(18),
    overflow: 'hidden',
  },
  campoFila: { flexDirection: 'row', gap: Spacing.two, alignItems: 'stretch' },
  campo: {
    flex: 1,
    borderWidth: 1,
    borderColor: Palette.bordeCampo,
    borderRadius: Radius.campo,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: FontSize.cuerpo,
    color: Palette.texto,
    minHeight: 44,
  },
  boton: {
    backgroundColor: Palette.primario,
    borderRadius: Radius.boton,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 104,
    alignItems: 'center',
  },
  botonInactivo: { backgroundColor: Palette.deshabilitado },
  botonTexto: { color: Palette.primarioTexto, fontWeight: '600', fontSize: FontSize.cuerpo },

  error: { gap: Spacing.one },
  errorTexto: { color: Palette.gasto, fontSize: FontSize.etiqueta },
  reintentar: { color: Palette.primario, fontWeight: '600', fontSize: FontSize.etiqueta },

  respuestaBloque: { gap: Spacing.two, paddingTop: Spacing.one },
  veredicto: { fontSize: FontSize.etiqueta, fontWeight: '700', letterSpacing: 0.3 },
  respuesta: { fontSize: FontSize.cuerpo, lineHeight: 22, color: Palette.texto },

  cifras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Palette.fondo,
    borderRadius: Radius.campo,
    padding: Spacing.two + 2,
    gap: Spacing.three,
  },
  cifra: { minWidth: 76 },
  cifraEtiqueta: { fontSize: FontSize.micro, color: Palette.textoSuave },
  cifraValor: {
    fontSize: FontSize.etiqueta,
    fontWeight: '600',
    color: Palette.texto,
    ...Tipografia.tabular,
  },

  chips: { marginTop: Spacing.one },
  chip: {
    backgroundColor: Palette.primarioSuave,
    borderRadius: Radius.pastilla(32),
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginRight: Spacing.two,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipTexto: { color: Palette.primario, fontSize: FontSize.etiqueta, fontWeight: '500' },
});
