
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { precioFinal } from "../utils/precios";

const CarritoContext = createContext(null);

// Recuperar el carrito al actualizar la pagina
function obtenerCarritoGuardado() {
  try {
    const guardado = localStorage.getItem("carrito");

    if (!guardado) return [];

    const datos = JSON.parse(guardado);

    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function CarritoProvider({ children }) {

  const [carrito, setCarrito] = useState(
    obtenerCarritoGuardado
  );

  // Guardar el carrito cuando cambia
  useEffect(() => {
    localStorage.setItem(
      "carrito",
      JSON.stringify(carrito)
    );
  }, [carrito]);

  // Agregar un producto al carrito
  const agregarAlCarrito = (producto) => {

    if (!producto || producto.id == null) return;

    setCarrito((actual) => {

      const stock = Number.isInteger(producto.stock)
        ? producto.stock
        : 0;

      const existente = actual.find(
        (item) => item.id === producto.id
      );

      const cantidadActual = existente?.cantidad || 0;

      // No superar el stock disponible
      if (stock <= 0 || cantidadActual >= stock) {
        return actual;
      }

      if (existente) {
        return actual.map((item) =>
          item.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item
        );
      }

      return [
        ...actual,
        {
          ...producto,
          precio: precioFinal(producto),
          cantidad: 1,
        },
      ];
    });
  };

  // Eliminar un producto del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito((actual) =>
      actual.filter((producto) => producto.id !== id)
    );
  };

  // Aumentar la cantidad de un producto
  const aumentarCantidad = (id) => {
    setCarrito((actual) =>
      actual.map((producto) => {

        if (producto.id !== id) return producto;

        const stock = Number.isInteger(producto.stock)
          ? producto.stock
          : 0;

        if (producto.cantidad >= stock) {
          return producto;
        }

        return {
          ...producto,
          cantidad: producto.cantidad + 1,
        };
      })
    );
  };

  // Disminuir cantidad y eliminar si llega a cero
  const disminuirCantidad = (id) => {
    setCarrito((actual) =>
      actual
        .map((producto) =>
          producto.id === id
            ? {
                ...producto,
                cantidad: producto.cantidad - 1,
              }
            : producto
        )
        .filter((producto) => producto.cantidad > 0)
    );
  };

  // Vaciar el carrito despues de comprar
  const vaciarCarrito = () => {
    setCarrito([]);
  };

  // Calcular cantidad total de unidades
  const cantidadTotal = carrito.reduce(
    (total, producto) =>
      total + producto.cantidad,
    0
  );

  // Calcular total estimado de la compra
  const totalCarrito = carrito.reduce(
    (total, producto) =>
      total + producto.precio * producto.cantidad,
    0
  );

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        aumentarCantidad,
        disminuirCantidad,
        vaciarCarrito,
        cantidadTotal,
        totalCarrito,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

// Permite usar el carrito desde otros componentes
export function useCarrito() {

  const contexto = useContext(CarritoContext);

  if (!contexto) {
    throw new Error(
      "useCarrito debe utilizarse dentro de CarritoProvider"
    );
  }

  return contexto;
}
