/**
 * Cliente HTTP central de la app.
 * Toda llamada al backend pasa por aquí (auth token, base URL, errores).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8001';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
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

/** Texto por código, para cuando no hay nada aprovechable en la respuesta. */
function generico(status: number): string {
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

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch solo lanza si no hubo respuesta: sin red, DNS, servidor caído.
    // El backend en Render duerme, así que la primera petición puede tardar.
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.',
      0,
      null,
    );
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = await res.text().catch(() => null);
    }
    throw new ApiError(mensajeDeError(payload, res.status), res.status, payload);
  }

  // 204 No Content: borrar una transacción no devuelve cuerpo.
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}
