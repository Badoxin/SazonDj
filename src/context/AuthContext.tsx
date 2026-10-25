import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { onUnauthorized } from "../api/http";
import { getToken, removeToken, setToken } from "../api/token";
import { getMeApi, type Me } from "../api/user";

// auth === undefined → todavía se está revisando si hay sesión; null → sin sesión; objeto → sesión abierta.
export type Auth = { token: string; me: Me } | null | undefined;

type AuthContextValue = {
  auth: Auth;
  login: (token: string) => Promise<Me>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  auth: undefined,
  login: async () => { throw new Error("AuthProvider no está montado"); },
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<Auth>(undefined);

  const logout = useCallback(() => {
    removeToken();
    setAuth(null);
  }, []);

  const login = useCallback(async (token: string) => {
    setToken(token);
    try {
      const me = await getMeApi(token);
      setAuth({ token, me });
      return me;
    } catch (error) {
      // El manual no limpiaba el token si /auth/me fallaba y dejaba una sesión a medias.
      removeToken();
      setAuth(null);
      throw error;
    }
  }, []);

  // Al abrir la página: si hay un token guardado, se valida con el servidor.
  useEffect(() => {
    const token = getToken();
    if (!token) setAuth(null);
    else login(token).catch(() => {});
  }, [login]);

  // Si el servidor dice 401 con una sesión abierta (token vencido), se cierra la sesión y se avisa.
  useEffect(() => {
    onUnauthorized(() => {
      if (getToken()) {
        logout();
        toast.info("Tu sesión expiró. Inicia sesión de nuevo.");
      }
    });
    return () => onUnauthorized(null);
  }, [logout]);

  const value = useMemo(() => ({ auth, login, logout }), [auth, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
