
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// ==========================================
// FORMATO DE PRECIOS
// ==========================================

const formatoPrecio = (valor) => {
  return Number(valor ?? 0).toLocaleString("es-CL");
};

// ==========================================
// FORMATO DE FECHAS
// ==========================================

const formatoFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const convertida = new Date(fecha);

  if (Number.isNaN(convertida.getTime())) {
    return String(fecha);
  }

  return convertida.toLocaleString("es-CL");
};

export default function BoletaAdmin() {

  // ==========================================
  // OBTENER ID DESDE LA URL
  // ==========================================

  const { numero } = useParams();

  const idValido = /^[1-9]\d*$/.test(
    String(numero ?? "")
  );

  // ==========================================
  // AUTENTICACION
  // ==========================================

  const { usuarioActual, token } = useAuth();

  const esAdmin = usuarioActual?.rol === "admin";

  // ==========================================
  // ESTADOS
  // ==========================================

  const [boleta, setBoleta] = useState(null);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  const [recarga, setRecarga] = useState(0);

  // ==========================================
  // CONSULTAR BOLETA DESDE SPRING BOOT
  // ==========================================

  useEffect(() => {

    if (!esAdmin || !token || !idValido) {
      setBoleta(null);
      setCargando(false);
      return;
    }

    const controller = new AbortController();

    const cargarBoleta = async () => {

      setCargando(true);
      setError("");
      setBoleta(null);

      try {

        // GET /api/v1/boletas/{id}

        const respuesta = await api.get(
          `/boletas/${numero}`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!controller.signal.aborted) {
          setBoleta(respuesta.data);
        }

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error(
          "Error al consultar boleta:",
          err
        );

        const estado = err.response?.status;

        if (estado === 401) {

          setError(
            "Tu sesión venció. Inicia sesión nuevamente."
          );

        } else if (estado === 403) {

          setError(
            "No tienes permisos para consultar esta boleta."
          );

        } else if (estado === 404) {

          setError(
            "La boleta solicitada no existe en MySQL."
          );

        } else {

          setError(
            "No se pudo cargar la boleta. Revisa la conexión con Spring Boot."
          );

        }

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false);
        }

      }

    };

    cargarBoleta();

    return () => controller.abort();

  }, [numero, token, esAdmin, idValido, recarga]);

  // ==========================================
  // RESTRINGIR ACCESO
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
  // VALIDAR NUMERO
  // ==========================================

  if (!idValido) {

    return (
      <div className="container py-5">

        <div className="alert alert-warning">
          El número de boleta no es válido.
        </div>

        <Link
          to="/admin/ordenes"
          className="btn btn-outline-success"
        >
          Volver a órdenes
        </Link>

      </div>
    );

  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div className="container py-4">

      {/* ENCABEZADO */}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 d-print-none">

        <div>

          <Link
            to="/admin/ordenes"
            className="btn btn-outline-secondary btn-sm mb-3"
          >
            ← Volver a órdenes
          </Link>

          <h1 className="fw-bold text-success mb-2">
            🧾 Detalle de boleta
          </h1>

          <p className="text-muted mb-0">
            Información registrada en Spring Boot y MySQL.
          </p>

        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          disabled={cargando}
          onClick={() =>
            setRecarga((anterior) => anterior + 1)
          }
        >
          🔄 Actualizar
        </button>

      </div>

      {/* CARGANDO */}

      {cargando && (

        <div className="alert alert-info">
          Cargando boleta desde MySQL...
        </div>

      )}

      {/* ERROR */}

      {error && (

        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>

      )}

      {/* DATOS DE LA BOLETA */}

      {!cargando && !error && boleta && (

        <>

          {/* INFORMACION GENERAL */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">

                <div>

                  <h2 className="fw-bold text-success">
                    Boleta N.º {boleta.id}
                  </h2>

                  <p className="text-muted mb-0">
                    Fecha: {formatoFecha(boleta.fecha)}
                  </p>

                </div>

                <span className="badge bg-warning text-dark fs-6">
                  {boleta.estado ?? "SIN ESTADO"}
                </span>

              </div>

              <hr />

              <div className="row g-3">

                <div className="col-md-6">

                  <p className="text-muted mb-1">
                    ID del cliente
                  </p>

                  <h5 className="fw-semibold">
                    #{boleta.usuarioId}
                  </h5>

                </div>

                <div className="col-md-6">

                  <p className="text-muted mb-1">
                    Total del pedido
                  </p>

                  <h3 className="fw-bold text-success">
                    ${formatoPrecio(boleta.total)}
                  </h3>

                </div>

              </div>

            </div>

          </div>

          {/* PRODUCTOS COMPRADOS */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <h4 className="fw-bold text-success mb-4">
                📦 Productos comprados
              </h4>

              {!Array.isArray(boleta.detalles) ||
              boleta.detalles.length === 0 ? (

                <div className="alert alert-info">
                  Esta boleta no contiene detalles de productos.
                </div>

              ) : (

                <div className="table-responsive">

                  <table className="table table-striped align-middle">

                    <thead>

                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Subtotal</th>
                      </tr>

                    </thead>

                    <tbody>

                      {boleta.detalles.map((detalle, index) => (

                        <tr
                          key={
                            detalle.id ??
                            `${detalle.productoId}-${index}`
                          }
                        >

                          <td>

                            <strong>
                              {detalle.nombreProducto}
                            </strong>

                            <div className="small text-muted">
                              ID producto: {detalle.productoId}
                            </div>

                          </td>

                          <td>
                            {detalle.cantidad}
                          </td>

                          <td>
                            ${formatoPrecio(
                              detalle.precioUnitario
                            )}
                          </td>

                          <td className="fw-semibold">
                            ${formatoPrecio(
                              detalle.subtotal
                            )}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

              <hr />

              <div className="d-flex justify-content-end align-items-center gap-3">

                <h5 className="mb-0">
                  Total:
                </h5>

                <h3 className="fw-bold text-success mb-0">
                  ${formatoPrecio(boleta.total)}
                </h3>

              </div>

            </div>

          </div>

          {/* INFORMACION DE ESTADO */}

          <div className="alert alert-info d-print-none">

            <strong>Información:</strong> estos datos provienen
            directamente de MySQL.

            <div className="mt-2">
              El estado PENDIENTE no significa que la compra
              haya sido pagada.
            </div>

          </div>

          {/* ACCIONES */}

          <div className="d-flex gap-2 flex-wrap d-print-none">

            <Link
              to="/admin/ordenes"
              className="btn btn-success"
            >
              ← Volver al listado
            </Link>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => window.print()}
            >
              🖨️ Imprimir detalle
            </button>

          </div>

        </>

      )}

    </div>

  );

}
