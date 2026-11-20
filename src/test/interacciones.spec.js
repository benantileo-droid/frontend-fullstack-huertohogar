
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
  categoria: "Frutas",
  descripcion: "Manzana fresca",
  imagen: "https://via.placeholder.com/300",
};

// ==========================================
// LIMPIAR EL DOM DESPUES DE CADA PRUEBA
// ==========================================

afterEach(() => {
  cleanup();
});

// ==========================================
// PRODUCT CARD - INTERACCIONES ADMIN
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

    const botonEditar = getByRole(
      "button",
      {
        name: /Editar/i,
      }
    );

    fireEvent.click(botonEditar);

    expect(onEdit).toHaveBeenCalled();

    expect(onDelete).not.toHaveBeenCalled();

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

    const botonEliminar = getByRole(
      "button",
      {
        name: /Eliminar/i,
      }
    );

    fireEvent.click(botonEliminar);

    expect(onDelete).toHaveBeenCalled();

    expect(onEdit).not.toHaveBeenCalled();

  });

  // ========================================
  // PRUEBA 13
  // ========================================

  it("13. Debe ocultar Editar y Eliminar fuera del modo Admin", () => {

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

    const botonEditar = queryByRole(
      "button",
      {
        name: /Editar/i,
      }
    );

    const botonEliminar = queryByRole(
      "button",
      {
        name: /Eliminar/i,
      }
    );

    expect(botonEditar).toBeNull();

    expect(botonEliminar).toBeNull();

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

    const botonDisminuir = getByRole(
      "button",
      {
        name: "-",
      }
    );

    fireEvent.click(botonDisminuir);

    expect(onDecrease).toHaveBeenCalledWith(1);

    expect(onIncrease).not.toHaveBeenCalled();

  });

});
