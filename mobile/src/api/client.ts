/**
 * Cliente HTTP central de la app.
 * Toda llamada al backend pasa por aquí (auth token, base URL, errores).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8001';

/**
 * Cuánto se espera antes de rendirse con una petición.
 *
 * El backend vive en el plan gratis de Render, que duerme el servicio tras
 * ~15 minutos sin tráfico. Despertarlo tarda cerca de 50 segundos, así que el
 * límite tiene que ser generoso: cortar a los 10 s convertiría un arranque en
 * frío normal en un error. 60 s deja margen y aun así garantiza que la app
 * nunca se queda colgada para siempre.
 */
const TIMEOUT_MS = 60_000;

/** A partir de aquí se le avisa a la persona que esto va para largo. */
const DEMORA_MS = 3_000;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/* ------------------------------------------------------------------------ */
/* Avisos hacia la app                                                       */
/* ------------------------------------------------------------------------ */

/**
 * Peticiones en vuelo que ya pasaron el umbral de demora.
 *
 * Se cuenta en vez de usar un booleano porque el dashboard dispara varias
 * llamadas a la vez: con un booleano, la primera en terminar apagaría el aviso
 * mientras las otras siguen esperando.
 */
let lentasEnVuelo = 0;
let avisarDemora: ((tardando: boolean) => void) | null = null;

/** La app se suscribe para mostrar «el servidor está despertando». */
export function escucharDemora(cb: ((tardando: boolean) => void) | null) {
  avisarDemora = cb;
}

function marcarLenta(delta: number) {
  const antes = lentasEnVuelo;
  lentasEnVuelo = Math.max(0, lentasEnVuelo + delta);
  if (antes === 0 && lentasEnVuelo > 0) avisarDemora?.(true);
  if (antes > 0 && lentasEnVuelo === 0) avisarDemora?.(false);
}

let avisarSesionVencida: (() => void) | null = null;

/**
 * La app se suscribe para cerrar sesión cuando el backend rechaza el token.
 *
 * El token dura 60 minutos. Sin esto, cuando vence, cada pantalla muestra un
 * error y nada devuelve a la persona al login: queda atrapada.
 */
export function escucharSesionVencida(cb: (() => void) | null) {
  avisarSesionVencida = cb;
}

/**
 * Error de una llamada al API, con un mensaje que se puede mostrar en pantalla.
 *
 * `message` es texto para la persona usuaria. `status` y `payload` quedan para
 * quien depure.
 */
export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Traduce los mensajes de validación de Pydantic, que vienen en inglés.
 *
 * El backend responde 422 con textos como "value is not a valid email address"
 * o "String should have at least 8 characters". Mostrarlos tal cual deja la
 * app medio en inglés justo en el momento en que algo salió mal.
 *
 * Si un mensaje no está en esta lista NO se muestra en inglés: se cae al
 * texto genérico por código. Es preferible un mensaje vago en castellano a
 * uno preciso que la persona no entiende.
 */
const TRADUCCIONES: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/valid email|@-sign|email address/i, 'Escribí un correo válido.'],
  [/already (registered|exists)|ya (está|esta) registrado/i, 'Ese correo ya está registrado.'],
  [/at least (\d+) character/i, (m) => `Muy corto: necesita al menos ${m[1]} caracteres.`],
  [/at most (\d+) character/i, (m) => `Muy largo: máximo ${m[1]} caracteres.`],
  [/greater than 0|greater_than/i, 'Tiene que ser mayor a cero.'],
  [/field required|missing/i, 'Falta completar un campo obligatorio.'],
  [/valid date|invalid date/i, 'Revisá la fecha: tiene que ser año-mes-día.'],
  [/valid integer|valid number/i, 'Ese campo tiene que ser un número.'],
];

function traducir(msg: string): string | null {
  for (const [patron, reemplazo] of TRADUCCIONES) {
    const m = msg.match(patron);
    if (m) return typeof reemplazo === 'function' ? reemplazo(m) : reemplazo;
  }
  return null;
}

/** Las únicas rutas donde un 401 habla de la contraseña y no del token. */
const CREDENCIALES = ['/auth/login', '/auth/register'];

/** Texto por código, para cuando no hay nada aprovechable en la respuesta. */
function generico(status: number): string {
  // Solo llega aquí en /auth/: fuera de ahí, api() trata el 401 como
  // sesión vencida antes de consultar esta tabla.
  if (status === 401) return 'Correo o contraseña incorrectos.';
  if (status === 403) return 'No tenés permiso para hacer esto.';
  if (status === 404) return 'No encontramos lo que buscabas.';
  if (status === 409) return 'Ese dato ya existe.';
  if (status === 422) return 'Revisá los datos: alguno no es válido.';
  if (status >= 500) return 'El servidor tuvo un problema. Probá de nuevo en un momento.';
  return `No se pudo completar la operación (error ${status}).`;
}

/**
 * FastAPI devuelve el error en `detail`, y no siempre con la misma forma:
 *
 *   401 → { "detail": "Credenciales invalidas" }          string
 *   422 → { "detail": [ { loc, msg, type }, ... ] }       arreglo de errores
 *
 * Sin esto, la pantalla mostraría el JSON crudo. HU-06 pide que el error del
 * API sea legible, así que la traducción a texto se hace aquí una sola vez y
 * no en cada pantalla.
 */
function mensajeDeError(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.trim()) {
    return traducir(payload) ?? payload;
  }

  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;

    // El backend escribe sus propios mensajes en castellano, así que un
    // detail de tipo cadena se muestra tal cual salvo que reconozcamos algo.
    if (typeof detail === 'string' && detail.trim()) {
      return traducir(detail) ?? detail;
    }

    if (Array.isArray(detail)) {
      const mensajes = detail
        .map((e) => (e && typeof e === 'object' && 'msg' in e ? String(e.msg) : ''))
        .map((m) => traducir(m))
        .filter((m): m is string => Boolean(m));
      if (mensajes.length) return [...new Set(mensajes)].join(' ');
      // Había errores pero ninguno reconocido: mejor genérico que inglés.
      return generico(status);
    }
  }

  return generico(status);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;

  // `fetch` no tiene timeout propio: sin esto, una petición que nunca responde
  // deja la pantalla en el spinner para siempre.
  const corte = new AbortController();
  const temporizador = setTimeout(() => corte.abort(), TIMEOUT_MS);

  // La bandera es imprescindible: sin ella el contador sube cuando salta el
  // aviso pero no baja nunca, y el mensaje de «despertando» se queda pegado
  // en pantalla para siempre.
  let seMarcoLenta = false;
  const avisoDemora = setTimeout(() => {
    seMarcoLenta = true;
    marcarLenta(1);
  }, DEMORA_MS);

  /** Apaga temporizador y aviso. Se llama una sola vez por petición. */
  function limpiar() {
    clearTimeout(temporizador);
    clearTimeout(avisoDemora);
    if (seMarcoLenta) {
      seMarcoLenta = false;
      marcarLenta(-1);
    }
  }

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: corte.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    limpiar();
    // Se distingue el corte por tiempo de la falta de red: son dos problemas
    // distintos y la persona puede hacer algo distinto con cada uno.
    if (corte.signal.aborted) {
      throw new ApiError(
        'El servidor tardó demasiado en responder. Intentá de nuevo.',
        0,
        null,
      );
    }
    // fetch solo lanza si no hubo respuesta: sin red, DNS, servidor caído.
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.',
      0,
      null,
    );
  }

  // Hay respuesta: se apagan el corte por tiempo y el aviso antes de leer el
  // cuerpo, que ya no puede colgarse.
  limpiar();

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = await res.text().catch(() => null);
    }

    // Un 401 significa dos cosas muy distintas según dónde ocurra.
    //
    // Solo en /auth/login y /auth/register es que la contraseña está mala. En
    // cualquier otra ruta —incluida /auth/me— es que el token venció: decirle
    // a la persona que su contraseña es incorrecta mientras mira sus metas es
    // mentirle, y dejarla ahí sin devolverla al login la deja atrapada.
    //
    // Se listan las dos rutas en vez de filtrar por el prefijo /auth/ porque
    // /auth/me cae de ese lado del prefijo y del otro lado del significado.
    if (res.status === 401 && !CREDENCIALES.includes(path)) {
      avisarSesionVencida?.();
      throw new ApiError('Tu sesión venció. Volvé a entrar.', 401, payload);
    }

    throw new ApiError(mensajeDeError(payload, res.status), res.status, payload);
  }

  // 204 No Content: borrar una transacción no devuelve cuerpo.
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}
