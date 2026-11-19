
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "huerto_hogar_token";

// Leer la informacion del JWT
// Esto NO verifica su firma: Spring Boot se encarga
// de validar el token y los permisos reales.
function obtenerUsuarioDelToken(token) {
  try {
    if (!token) return null;

    const parte = token.split(".")[1];

    if (!parte) return null;

    const base64 = parte
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const contenido = atob(
      base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        "="
      )
    );

    const datos = JSON.parse(contenido);

    // Rechazar tokens vencidos
    if (
      !datos.exp ||
      datos.exp * 1000 <= Date.now()
    ) {
      return null;
    }

    if (!datos.sub || !datos.rol) {
      return null;
    }

    return {
      id: datos.usuarioId,
      correo: datos.sub,
      nombre: datos.sub,
      rol: String(datos.rol).toLowerCase(),
      expira: datos.exp,
    };

  } catch {
    return null;
  }
}

// Recuperar la sesion si todavia es valida
function recuperarToken() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!obtenerUsuarioDelToken(token)) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return token;
}

export function AuthProvider({ children }) {

  const [token, setToken] = useState(recuperarToken);

  const usuarioActual = useMemo(
    () => obtenerUsuarioDelToken(token),
    [token]
  );

  // Agregar el JWT a las solicitudes de Axios
  useEffect(() => {

    const interceptor = api.interceptors.request.use(
      (config) => {

        const tokenGuardado =
          localStorage.getItem(TOKEN_KEY);

        if (obtenerUsuarioDelToken(tokenGuardado)) {
          config.headers.set(
            "Authorization",
            `Bearer ${tokenGuardado}`
          );
        }

        return config;
      }
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };

  }, []);

  // Cerrar la sesion cuando venza el token
  useEffect(() => {

    if (!usuarioActual) return;

    const tiempoRestante =
      usuarioActual.expira * 1000 - Date.now();

    const temporizador = setTimeout(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }, Math.max(0, tiempoRestante));

    return () => clearTimeout(temporizador);

  }, [usuarioActual]);

  // Iniciar sesion desde Spring Boot
  const iniciarSesion = async (correo, password) => {

    const respuesta = await api.post("/auth/login", {
      correo,
      password,
    });

    const nuevoToken = respuesta.data.token;

    const usuario = obtenerUsuarioDelToken(nuevoToken);

    if (!usuario) {
      throw new Error(
        "El servidor devolvio un token invalido"
      );
    }

    localStorage.setItem(TOKEN_KEY, nuevoToken);
    setToken(nuevoToken);

    return usuario;
  };

  // Cerrar sesion
  const cerrarSesion = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("usuarioActual");
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        usuarioActual,
        autenticado: Boolean(usuarioActual),
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Permite utilizar la sesion en cualquier componente
export function useAuth() {

  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return contexto;
}
