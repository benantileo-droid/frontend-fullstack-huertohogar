
import React from "react";
import { Link } from "react-router-dom";

import {
  estaEnOferta,
  precioFinal,
} from "../utils/precios";

export default function ProductCard({
  product,
  onAddToCart,
  onDelete,
  onEdit,
  modoAdmin,
}) {

  // Obtener el stock recibido desde Spring Boot
  const stock = Number.isInteger(product.stock)
    ? product.stock
    : null;

  const agotado = stock === 0;
  const stockDesconocido = stock === null;

  // Formatear precios en pesos chilenos
  const formatoPrecio = (precio) =>
    Number(precio ?? 0).toLocaleString("es-CL");

  return (
    <div className="col-12 col-sm-6 col-md-6 col-lg-6 mb-4">

      <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">

        {/* IMAGEN Y CATEGORIA */}

        <div className="position-relative">

          <img
            src={
              product.imagen ||
              "https://via.placeholder.com/300"
            }
            className="card-img-top"
            alt={product.nombre}
            style={{
              height: "200px",
              objectFit: "cover",
            }}
          />

          <span className="position-absolute top-0 start-0 bg-success text-white badge m-2 px-3 py-2 rounded-pill">
            {product.categoria || "Orgánico"}
          </span>

          {agotado && (
            <span className="position-absolute top-0 end-0 badge bg-danger m-2 px-3 py-2">
              Agotado
            </span>
          )}

        </div>

        {/* INFORMACION DEL PRODUCTO */}

        <div className="card-body d-flex flex-column p-4">

          <h5 className="card-title fw-bold text-dark mb-1">
            {product.nombre}
          </h5>

          <p className="card-text text-muted small mb-3">
            {product.descripcion ||
              "Producto fresco del huerto."}
          </p>

          {/* STOCK DISPONIBLE */}

          <div className="mb-3">

            {agotado ? (
              <span className="badge bg-danger">
                ❌ Sin stock
              </span>
            ) : stockDesconocido ? (
              <span className="badge bg-secondary">
                Stock no disponible
              </span>
            ) : stock <= 5 ? (
              <span className="badge bg-warning text-dark">
                ⚠️ Últimas {stock} unidades
              </span>
            ) : (
              <span className="badge bg-success">
                ✅ Stock disponible: {stock} unidades
              </span>
            )}

          </div>

          {/* PRECIO */}

          <div className="mb-3">

            {estaEnOferta(product) ? (
              <>
                <small className="text-muted text-decoration-line-through d-block">
                  ${formatoPrecio(product.precio)}
                </small>

                <span className="fs-4 fw-bold text-success">
                  ${formatoPrecio(precioFinal(product))}
                </span>

                <span className="badge bg-danger ms-2">
                  -{product.descuento}%
                </span>
              </>
            ) : (
              <span className="fs-4 fw-bold text-success">
                ${formatoPrecio(product.precio)}
              </span>
            )}

          </div>

          {/* BOTONES */}

          <div className="d-flex flex-wrap gap-2 mt-auto">

            {modoAdmin ? (
              <>
                <button
                  type="button"
                  className="btn btn-warning btn-sm"
                  onClick={() => onEdit(product)}
                >
                  ✏️ Editar
                </button>

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(product.id)}
                >
                  🗑️ Eliminar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => onAddToCart(product)}
                  disabled={agotado || stockDesconocido}
                >
                  {agotado
                    ? "Sin stock"
                    : stockDesconocido
                      ? "No disponible"
                      : "+ Agregar"}
                </button>

                <Link
                  to={`/productos/${product.id}`}
                  className="btn btn-outline-success btn-sm"
                >
                  Ver detalle
                </Link>
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
