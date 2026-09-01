/**
 * Estado de sesión de la app.
 *
 * Una sola fuente de verdad para "¿hay alguien con sesión iniciada?". Las
 * pantallas no llaman a los endpoints de auth directamente: usan este contexto,
 * y él se encarga de guardar el token, ponerlo en el cliente HTTP y avisar al
 * resto de la app.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { setAuthToken } from '@/api/client';
import { iniciarSesion, registrar, yo, type Usuario } from '@/api/auth';
import { borrarToken, guardarToken, leerToken } from '@/context/session-storage';

type EstadoAuth = {
  /** Usuario con sesión iniciada, o null. */
  usuario: Usuario | null;
  /**
   * True mientras se comprueba el token guardado, al arrancar la app.
   * Mientras sea true no hay que decidir a dónde navegar: todavía no se sabe
   * si hay sesión, y redirigir aquí hace que el login parpadee en pantalla
   * para alguien que sí la tenía.
   */
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  crearCuenta: (email: string, password: string, name: string) => Promise<void>;
  salir: () => Promise<void>;
};

const Contexto = createContext<EstadoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al arrancar: ¿hay token guardado, y sigue siendo válido?
  useEffect(() => {
    let vigente = true;

    (async () => {
      try {
        const token = await leerToken();
        if (!token) return;

        setAuthToken(token);
        const u = await yo();
        if (vigente) setUsuario(u);
      } catch {
        // Token vencido, revocado, o sin red. En cualquier caso no hay sesión
        // utilizable: se limpia y la persona inicia sesión de nuevo.
        await borrarToken();
        setAuthToken(null);
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, []);

  const aplicarSesion = useCallback(
    async (sesion: { access_token: string; user: Usuario }) => {
      await guardarToken(sesion.access_token);
      setAuthToken(sesion.access_token);
      setUsuario(sesion.user);
    },
    [],
  );

  const entrar = useCallback(
    async (email: string, password: string) => {
      await aplicarSesion(await iniciarSesion(email, password));
    },
    [aplicarSesion],
  );

  const crearCuenta = useCallback(
    async (email: string, password: string, name: string) => {
      // El registro devuelve token, así que la persona queda dentro de una vez.
      await aplicarSesion(await registrar(email, password, name));
    },
    [aplicarSesion],
  );

  const salir = useCallback(async () => {
    await borrarToken();
    setAuthToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, crearCuenta, salir }),
    [usuario, cargando, entrar, crearCuenta, salir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): EstadoAuth {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error('useAuth se usó fuera de <AuthProvider>.');
  }
  return ctx;
}
