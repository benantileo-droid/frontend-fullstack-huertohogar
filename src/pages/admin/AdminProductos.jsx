
import { useState } from "react";
import { Link } from "react-router-dom";

import { estaEnOferta, precioFinal } from "../../utils/precios";
import { esStockCritico } from "../../utils/inventario";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminProductos({ productos = [] }) {

  // ==========================================
  // AUTENTICACION
  // ==========================================

  const { usuarioActual, token } = useAuth();

  // ==========================================
  // ESTADOS
  // ==========================================

  const [busqueda, setBusqueda] = useState("");

  const [eliminandoId, setEliminandoId] = useState(null);

  const [idsEliminados, setIdsEliminados] = useState([]);

  const [error, setError] = useState("");

  const [exito, setExito] = useState("");

  const esAdmin = usuarioActual?.rol === "admin";

  // ==========================================
  // ELIMINAR PRODUCTO EN MYSQL
  // ==========================================

  const handleEliminarProducto = async (producto) => {

    if (!esAdmin || !token) {
      setError(
        "Debes iniciar sesión como administrador."
      );
      return;
    }

    if (eliminandoId !== null) return;

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${producto.nombre}"?\n\n` +
      "Esta acción eliminará el producto de MySQL."
    );

    if (!confirmar) return;

    setEliminandoId(producto.id);
    setError("");
    setExito("");

    try {

      // DELETE /api/v1/productos/{id}

      await api.delete(
        `/productos/${producto.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Lo ocultamos de la tabla solo después
      // de que Spring Boot confirme la eliminación.

      setIdsEliminados((actuales) => [
        ...actuales,
        String(producto.id),
      ]);

      setExito(
        `El producto "${producto.nombre}" fue eliminado correctamente de MySQL.`
      );

    } catch (err) {

      console.error(
        "Error al eliminar producto:",
        err
      );

      const estado = err.response?.status;

      if (estado === 401) {

        setError(
          "Tu sesión venció. Inicia sesión nuevamente."
        );

      } else if (estado === 403) {

        setError(
          "No tienes permisos para eliminar productos."
        );

      } else if (estado === 404) {

        setError(
          "El producto ya no existe en MySQL."
        );

      } else if (estado === 409) {

        setError(
          "No se pudo eliminar el producto porque existe un conflicto con sus datos."
        );

      } else {

        setError(
          "No se pudo eliminar el producto. Si tiene compras asociadas, MySQL podría impedir su eliminación. Revisa también la consola de Spring Boot."
        );

      }

    } finally {

      setEliminandoId(null);

    }

  };

  // ==========================================
  // FILTRAR PRODUCTOS
  // ==========================================

  const texto = busqueda.trim().toLowerCase();

  const productosDisponibles = productos.filter(
    (producto) =>
      !idsEliminados.includes(String(producto.id))
  );

  const productosFiltrados = productosDisponibles.filter(
    (producto) =>

      String(producto.nombre ?? "")
        .toLowerCase()
        .includes(texto) ||

      String(producto.categoria ?? "")
        .toLowerCase()
        .includes(texto)
  );

  // ==========================================
  // CONTROL DE ACCESO
  // ==========================================

  if (!esAdmin) {

    return (

      <div className="container py-5">

        <div className="alert alert-danger">
          Acceso exclusivo para administradores.
        </div>

      </div>

    );

  }

  // ==========================================
  // INTERFAZ ADMINISTRATIVA
  // ==========================================

  return (

    <div className="container py-5">

      {/* ENCABEZADO */}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">

        <div>

          <h1 className="fw-bold text-success mb-1">
            📦 Productos
          </h1>

          <p className="text-muted mb-0">
            Administrar inventario y productos de MySQL.
          </p>

        </div>

        <Link
          to="/admin/productos/nuevo"
          className="btn btn-success"
        >
          ➕ Nuevo producto
        </Link>

      </div>

      {/* MENSAJE DE EXITO */}

      {exito && (

        <div
          className="alert alert-success"
          role="status"
        >
          ✅ {exito}
        </div>

      )}

      {/* MENSAJE DE ERROR */}

      {error && (

        <div
          className="alert alert-danger"
          role="alert"
        >
          ❌ {error}
        </div>

      )}

      {/* BUSCADOR */}

      <input
        type="text"
        className="form-control mb-3"
        placeholder="🔍 Buscar por nombre o categoría..."
        value={busqueda}
        onChange={(e) =>
          setBusqueda(e.target.value)
        }
      />

      {/* TABLA DE PRODUCTOS */}

      <div className="card border-0 shadow-sm">

        <div className="card-body">

          {productosFiltrados.length === 0 ? (

            <div className="alert alert-secondary mb-0">
              No hay productos para mostrar.
            </div>

          ) : (

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead>

                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th className="text-end">
                      Acciones
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {productosFiltrados.map((producto) => (

                    <tr key={producto.id}>

                      {/* IMAGEN */}

                      <td>

                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          width="48"
                          height="48"
                          style={{
                            objectFit: "cover",
                          }}
                          className="rounded"
                        />

                      </td>

                      {/* NOMBRE */}

                      <td className="fw-semibold">
                        {producto.nombre}
                      </td>

                      {/* CATEGORIA */}

                      <td>
                        {producto.categoria}
                      </td>

                      {/* PRECIO */}

                      <td>

                        {estaEnOferta(producto) ? (

                          <>

                            <small className="text-muted text-decoration-line-through me-1">
                              ${Number(
                                producto.precio
                              ).toLocaleString("es-CL")}
                            </small>

                            <span className="fw-bold text-success">
                              ${Number(
                                precioFinal(producto)
                              ).toLocaleString("es-CL")}
                            </span>

                            <span className="badge bg-danger ms-1">
                              {producto.descuento}%
                            </span>

                          </>

                        ) : (

                          <>
                            ${Number(
                              producto.precio
                            ).toLocaleString("es-CL")}
                          </>

                        )}

                      </td>

                      {/* STOCK */}

                      <td>

                        {typeof producto.stock !== "number" ? (

                          "—"

                        ) : (

                          <span
                            className={`badge ${
                              esStockCritico(producto)
                                ? "bg-danger"
                                : "bg-success"
                            }`}
                          >
                            {producto.stock}
                          </span>

                        )}

                      </td>

                      {/* ACCIONES */}

                      <td className="text-end">

                        <Link
                          to={`/admin/productos/${producto.id}/editar`}
                          className="btn btn-warning btn-sm me-2"
                        >
                          ✏️ Editar
                        </Link>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={eliminandoId !== null}
                          onClick={() =>
                            handleEliminarProducto(producto)
                          }
                        >
                          {eliminandoId === producto.id
                            ? "Eliminando..."
                            : "🗑️ Eliminar"}
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}
