
import React from "react";

import {
  render,
  renderHook,
  waitFor,
  act,
  fireEvent,
  screen,
  cleanup,
} from "@testing-library/react";

import {
  MemoryRouter,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";
import useProductosApi from "../hooks/useProductosApi";

// ==========================================
// DATOS SIMULADOS
// ==========================================

const productosPrueba = [
  {
    id: 1,
    nombre: "Manzana Orgánica",
    precio: 1200,
    stock: 10,
    categoria: "Frutas",
  },
  {
    id: 2,
    nombre: "Tomate Orgánico",
    precio: 1500,
    stock: 20,
    categoria: "Verduras",
  },
];

// ==========================================
// ESPERAR ACTUALIZACION DE REACT
// ==========================================

// Importante:
// Jasmine registra los expect fallidos,
// pero waitFor necesita que se lance
// un error para continuar esperando.

const esperarFinDeCarga = async (result) => {

  await waitFor(() => {

    if (result.current.cargando) {
      throw new Error(
        "La API todavía está cargando."
      );
    }

  });

};

// ==========================================
// LIMPIEZA
// ==========================================

afterEach(() => {
  cleanup();
});

// ==========================================
// PRUEBAS DE useProductosApi
// ==========================================

describe("useProductosApi - Consultas a Spring Boot", () => {

  // ========================================
  // PRUEBA 15: CARGAR PRODUCTOS
  // ========================================

  it("15. Debe cargar productos desde la API", async () => {

    const getMock = spyOn(
      api,
      "get"
    ).and.returnValue(
      Promise.resolve({
        data: productosPrueba,
      })
    );

    const { result } = renderHook(
      () => useProductosApi(),
      {
        wrapper: MemoryRouter,
      }
    );

    await esperarFinDeCarga(result);

    expect(result.current.cargando).toBe(false);

    expect(result.current.productos).toEqual(
      productosPrueba
    );

    expect(result.current.error).toBeNull();

    expect(getMock).toHaveBeenCalledTimes(1);

    expect(
      getMock.calls.mostRecent().args[0]
    ).toBe("/productos");

  });

  // ========================================
  // PRUEBA 16: LISTA VACIA
  // ========================================

  it("16. Debe aceptar una lista vacía", async () => {

    spyOn(api, "get").and.returnValue(
      Promise.resolve({
        data: [],
      })
    );

    const { result } = renderHook(
      () => useProductosApi(),
      {
        wrapper: MemoryRouter,
      }
    );

    await esperarFinDeCarga(result);

    expect(result.current.cargando).toBe(false);

    expect(result.current.productos).toEqual([]);

    expect(result.current.error).toBeNull();

  });

  // ========================================
  // PRUEBA 17: ERROR EN LA API
  // ========================================

  it("17. Debe mostrar un error si falla la API", async () => {

    // Silenciar únicamente el error simulado.

    const errorSpy = spyOn(
      console,
      "error"
    ).and.stub();

    spyOn(api, "get").and.returnValue(
      Promise.reject(
        new Error("Conexión simulada fallida")
      )
    );

    const { result } = renderHook(
      () => useProductosApi(),
      {
        wrapper: MemoryRouter,
      }
    );

    await esperarFinDeCarga(result);

    expect(result.current.cargando).toBe(false);

    expect(result.current.productos).toEqual([]);

    expect(result.current.error).toBe(
      "No se pudieron cargar los productos."
    );

    expect(errorSpy).toHaveBeenCalled();

  });

  // ========================================
  // PRUEBA 18: ESTADO DE CARGA
  // ========================================

  it("18. Debe mantener cargando hasta recibir la respuesta", async () => {

    let resolverRespuesta;

    const respuestaPendiente = new Promise(
      (resolve) => {
        resolverRespuesta = resolve;
      }
    );

    spyOn(api, "get").and.returnValue(
      respuestaPendiente
    );

    const { result } = renderHook(
      () => useProductosApi(),
      {
        wrapper: MemoryRouter,
      }
    );

    // La solicitud todavía está pendiente.

    expect(result.current.cargando).toBe(true);

    expect(result.current.productos).toEqual([]);

    // Simular la llegada de la respuesta.

    await act(async () => {

      resolverRespuesta({
        data: productosPrueba,
      });

      await respuestaPendiente;

    });

    await esperarFinDeCarga(result);

    expect(result.current.cargando).toBe(false);

    expect(result.current.productos).toEqual(
      productosPrueba
    );

    expect(result.current.error).toBeNull();

  });

  // ========================================
  // PRUEBA 19: CAMBIO DE RUTA
  // ========================================

  it("19. Debe volver a consultar cuando cambia la página", async () => {

    const primeraRespuesta = [
      {
        id: 1,
        nombre: "Manzana Orgánica",
        precio: 1200,
        stock: 10,
      },
    ];

    const segundaRespuesta = [
      {
        id: 2,
        nombre: "Tomate Orgánico",
        precio: 1500,
        stock: 20,
      },
    ];

    const getMock = spyOn(
      api,
      "get"
    ).and.returnValues(

      Promise.resolve({
        data: primeraRespuesta,
      }),

      Promise.resolve({
        data: segundaRespuesta,
      })

    );

    // Componente real que utiliza el hook.

    function PantallaPrueba() {

      const {
        productos,
        cargando,
      } = useProductosApi();

      const navigate = useNavigate();

      return (

        <div>

          <button
            type="button"
            onClick={() => navigate("/categorias")}
          >
            Cambiar ruta
          </button>

          {cargando && (
            <p>Cargando...</p>
          )}

          <ul>
            {productos.map((producto) => (

              <li key={producto.id}>
                {producto.nombre}
              </li>

            ))}
          </ul>

        </div>

      );
    }

    // ======================================
    // INICIAR EN /productos
    // ======================================

    render(

      <MemoryRouter initialEntries={["/productos"]}>

        <PantallaPrueba />

      </MemoryRouter>

    );

    // Esperar realmente a que aparezca
    // el producto de la primera respuesta.

    await screen.findByText("Manzana Orgánica");

    expect(getMock).toHaveBeenCalledTimes(1);

    expect(
      getMock.calls.argsFor(0)[0]
    ).toBe("/productos");

    // ======================================
    // NAVEGAR A /categorias
    // ======================================

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cambiar ruta",
      })
    );

    // Esperar el producto actualizado
    // después de la segunda consulta.

    await screen.findByText("Tomate Orgánico");

    expect(getMock).toHaveBeenCalledTimes(2);

    expect(
      getMock.calls.argsFor(1)[0]
    ).toBe("/productos");

    // El producto anterior fue reemplazado.

    expect(
      screen.queryByText("Manzana Orgánica")
    ).toBeNull();

  });

});
