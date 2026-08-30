/**
 * Cliente HTTP central de la app.
 * Toda llamada al backend pasa por aquí (auth token, base URL, errores).
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${detail || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Ejemplo de uso (HU-06 en adelante):
// const me = await api<{ email: string }>("/auth/me");
