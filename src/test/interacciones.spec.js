
import React from "react";

import {
  render,
  fireEvent,
  cleanup,
} from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import ProductCard from "../components/ProductCard.jsx";
import Carrito from "../pages/Carrito.jsx";

// ==========================================
// DATOS DE PRUEBA
// ==========================================

const productoPrueba = {
  id: 1,
  nombre: "Manzana Orgánica",
  precio: 1200,
  stock: 10,
  categoria: "Frutas",
  descripcion: "Manzana fresca",
  imagen: "https://via.placeholder.com/300",
};

afterEach(() => {
  cleanup();
});

// ==========================================
// PRODUCT CARD - ADMINISTRACION
// ==========================================

describe("ProductCard - Acciones administrativas", () => {

  // ========================================
  // PRUEBA 11
  // ========================================

  it("11. Debe ejecutar onEdit al presionar Editar", () => {

    const onEdit = jasmine.createSpy("onEdit");
    const onDelete = jasmine.createSpy("onDelete");

    const { getByRole } = render(
      <MemoryRouter>
        <ProductCard
          product={productoPrueba}
          onAddToCart={() => {}}
          onEdit={onEdit}
          onDelete={onDelete}
          modoAdmin={true}
        />
      </MemoryRouter>
    );

    fireEvent.click(
      getByRole("button", {
        name: /Editar/i,
      })
    );

    expect(
      onEdit
    ).toHaveBeenCalledWith(productoPrueba);

    expect(
      onDelete
    ).not.toHaveBeenCalled();

  });

  // ========================================
  // PRUEBA 12
  // ========================================

  it("12. Debe ejecutar onDelete al presionar Eliminar", () => {

    const onEdit = jasmine.createSpy("onEdit");
    const onDelete = jasmine.createSpy("onDelete");

    const { getByRole } = render(
      <MemoryRouter>
        <ProductCard
          product={productoPrueba}
          onAddToCart={() => {}}
          onEdit={onEdit}
          onDelete={onDelete}
          modoAdmin={true}
        />
      </MemoryRouter>
    );

    fireEvent.click(
      getByRole("button", {
        name: /Eliminar/i,
      })
    );

    // ProductCard envía el ID, no el objeto.
    expect(
      onDelete
    ).toHaveBeenCalledWith(1);

    expect(
      onEdit
    ).not.toHaveBeenCalled();

  });

  // ========================================
  // PRUEBA 13
  // ========================================

  it("13. Debe ocultar botones administrativos en modo cliente", () => {

    const { queryByRole } = render(
      <MemoryRouter>
        <ProductCard
          product={productoPrueba}
          onAddToCart={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          modoAdmin={false}
        />
      </MemoryRouter>
    );

    expect(
      queryByRole("button", {
        name: /Editar/i,
      })
    ).toBeNull();

    expect(
      queryByRole("button", {
        name: /Eliminar/i,
      })
    ).toBeNull();

  });

});

// ==========================================
// CARRITO - DISMINUIR CANTIDAD
// ==========================================

describe("Carrito - Interacciones", () => {

  // ========================================
  // PRUEBA 14
  // ========================================

  it("14. Debe ejecutar onDecrease con el ID del producto", () => {

    const onDecrease =
      jasmine.createSpy("onDecrease");

    const onIncrease =
      jasmine.createSpy("onIncrease");

    const carritoPrueba = [
      {
        id: 1,
        nombre: "Manzana Orgánica",
        precio: 1200,
        cantidad: 2,
      },
    ];

    const { getByRole } = render(
      <MemoryRouter>
        <Carrito
          carrito={carritoPrueba}
          onRemove={() => {}}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
        />
      </MemoryRouter>
    );

    // Signo matemático de resta: −
    // Debe coincidir con Carrito.jsx.
    const botonDisminuir = getByRole(
      "button",
      {
        name: "−",
      }
    );

    fireEvent.click(botonDisminuir);

    expect(
      onDecrease
    ).toHaveBeenCalledWith(1);

    expect(
      onIncrease
    ).not.toHaveBeenCalled();

  });

});
