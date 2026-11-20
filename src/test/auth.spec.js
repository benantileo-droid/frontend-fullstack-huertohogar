
import React from "react";

import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

import api from "../services/api";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext.jsx";

// ==========================================
// CONFIGURACION DE PRUEBAS
// ==========================================

const TOKEN_KEY = "huerto_hogar_token";

// ==========================================
// CREAR JWT SIMULADO
// ==========================================

// Estos tokens son ficticios.
// No tienen una firma real.
//
// Sirven para probar AuthContext,
// porque el frontend solamente
// decodifica el contenido del JWT.
//
// Spring Boot es quien valida
// la firma y los permisos reales.

function crearTokenPrueba(
  rol = "CLIENTE",
  expiraEnSegundos = 3600
) {

  const encabezado = {
    alg: "HS256",
    typ: "JWT",
  };

  const contenido = {
    sub: "prueba@huertohogar.cl",
    usuarioId: 100,
    rol: rol,
    exp: Math.floor(Date.now() / 1000)
      + expiraEnSegundos,
  };

  const codificar = (objeto) => {

    return btoa(JSON.stringify(objeto))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  };

  return (
    codificar(encabezado) +
    "." +
    codificar(contenido) +
    ".firma-simulada"
  );
}

// ==========================================
// COMPONENTE PARA PROBAR LA SESION
// ==========================================

function SesionPrueba() {

  const {
    usuarioActual,
    autenticado,
    iniciarSesion,
    cerrarSesion,
  } = useAuth();

  return (

    <div>

      <p data-testid="estado-sesion">
        {autenticado
          ? "Autenticado"
          : "Sin sesión"}
      </p>

      <p data-testid="rol-usuario">
        {usuarioActual?.rol ?? "Sin rol"}
      </p>

      <p data-testid="correo-usuario">
        {usuarioActual?.correo ?? "Sin correo"}
      </p>

      <button
        type="button"
        onClick={() =>
          iniciarSesion(
            "prueba@huertohogar.cl",
            "clave-simulada"
          )
        }
      >
        Iniciar prueba
      </button>

      <button
        type="button"
        onClick={cerrarSesion}
      >
        Cerrar prueba
      </button>

    </div>

  );
}

// ==========================================
// FUNCION PARA RENDERIZAR EL CONTEXTO
// ==========================================

function renderizarSesion() {

  return render(

    <AuthProvider>

      <SesionPrueba />

    </AuthProvider>

  );

}

// ==========================================
// LIMPIAR ENTRE PRUEBAS
// ==========================================

beforeEach(() => {

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem("usuarioActual");

});

afterEach(() => {

  cleanup();

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem("usuarioActual");

});

// ==========================================
// PRUEBAS DE AUTENTICACION
// ==========================================

describe("AuthContext - Autenticacion JWT", () => {

  // ========================================
  // PRUEBA 20
  // SIN SESION
  // ========================================

  it("20. Debe iniciar sin sesion cuando no existe JWT", () => {

    renderizarSesion();

    expect(
      screen.getByTestId(
        "estado-sesion"
      ).textContent
    ).toBe("Sin sesión");

    expect(
      screen.getByTestId(
        "rol-usuario"
      ).textContent
    ).toBe("Sin rol");

    expect(
      localStorage.getItem(TOKEN_KEY)
    ).toBeNull();

  });

  // ========================================
  // PRUEBA 21
  // INICIAR SESION
  // ========================================

  it("21. Debe iniciar sesion y guardar un JWT valido", async () => {

    const tokenPrueba =
      crearTokenPrueba("ADMIN");

    // Simular respuesta de Spring Boot.

    const postMock = spyOn(
      api,
      "post"
    ).and.returnValue(

      Promise.resolve({
        data: {
          token: tokenPrueba,
        },
      })

    );

    renderizarSesion();

    // Simular clic en iniciar sesion.

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Iniciar prueba",
        }
      )
    );

    // Esperar el cambio de estado.
    // Usamos throw para que waitFor
    // funcione correctamente con Jasmine.

    await waitFor(() => {

      const estado = screen.getByTestId(
        "estado-sesion"
      ).textContent;

      if (estado !== "Autenticado") {
        throw new Error(
          "La sesión todavía no está autenticada."
        );
      }

    });

    expect(
      screen.getByTestId(
        "rol-usuario"
      ).textContent
    ).toBe("admin");

    expect(
      screen.getByTestId(
        "correo-usuario"
      ).textContent
    ).toBe("prueba@huertohogar.cl");

    expect(
      localStorage.getItem(TOKEN_KEY)
    ).toBe(tokenPrueba);

    expect(postMock).toHaveBeenCalledWith(
      "/auth/login",
      {
        correo: "prueba@huertohogar.cl",
        password: "clave-simulada",
      }
    );

  });

  // ========================================
  // PRUEBA 22
  // VALIDAR LOS TRES ROLES
  // ========================================

  it("22. Debe reconocer CLIENTE, VENDEDOR y ADMIN", () => {

    const roles = [
      "CLIENTE",
      "VENDEDOR",
      "ADMIN",
    ];

    for (const rol of roles) {

      const tokenPrueba =
        crearTokenPrueba(rol);

      localStorage.setItem(
        TOKEN_KEY,
        tokenPrueba
      );

      const { unmount } =
        renderizarSesion();

      expect(
        screen.getByTestId(
          "estado-sesion"
        ).textContent
      ).toBe("Autenticado");

      expect(
        screen.getByTestId(
          "rol-usuario"
        ).textContent
      ).toBe(rol.toLowerCase());

      // Desmontar antes de probar
      // el siguiente usuario.

      unmount();

      localStorage.removeItem(TOKEN_KEY);

    }

  });

  // ========================================
  // PRUEBA 23
  // CERRAR SESION
  // ========================================

  it("23. Debe cerrar sesion y eliminar el token", () => {

    const tokenPrueba =
      crearTokenPrueba("ADMIN");

    // Simular una sesion guardada.

    localStorage.setItem(
      TOKEN_KEY,
      tokenPrueba
    );

    localStorage.setItem(
      "usuarioActual",
      "dato-antiguo"
    );

    renderizarSesion();

    // Comprobar que recupera la sesion.

    expect(
      screen.getByTestId(
        "estado-sesion"
      ).textContent
    ).toBe("Autenticado");

    // Cerrar sesion.

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Cerrar prueba",
        }
      )
    );

    expect(
      screen.getByTestId(
        "estado-sesion"
      ).textContent
    ).toBe("Sin sesión");

    expect(
      screen.getByTestId(
        "rol-usuario"
      ).textContent
    ).toBe("Sin rol");

    expect(
      localStorage.getItem(TOKEN_KEY)
    ).toBeNull();

    expect(
      localStorage.getItem(
        "usuarioActual"
      )
    ).toBeNull();

  });

  // ========================================
  // PRUEBA 24
  // TOKEN VENCIDO
  // ========================================

  it("24. Debe rechazar un JWT vencido al recuperar la sesion", () => {

    // Crear token vencido hace 60 segundos.

    const tokenVencido =
      crearTokenPrueba(
        "ADMIN",
        -60
      );

    localStorage.setItem(
      TOKEN_KEY,
      tokenVencido
    );

    // Intentar recuperar la sesión.

    renderizarSesion();

    // No debe permitir acceso autenticado.

    expect(
      screen.getByTestId(
        "estado-sesion"
      ).textContent
    ).toBe("Sin sesión");

    expect(
      screen.getByTestId(
        "rol-usuario"
      ).textContent
    ).toBe("Sin rol");

    // Debe eliminar el JWT vencido.

    expect(
      localStorage.getItem(TOKEN_KEY)
    ).toBeNull();

  });

});
