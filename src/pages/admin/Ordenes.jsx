
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

// ==========================================
// COMPONENTE DE ORDENES
// ==========================================

export default function Ordenes() {

  // ==========================================
  // AUTENTICACION JWT
  // ==========================================

  const { usuarioActual, token } = useAuth();

  const esAdmin = usuarioActual?.rol === "admin";
  const esVendedor = usuarioActual?.rol === "vendedor";

  const tienePermiso = esAdmin || esVendedor;

  // ==========================================
  // ESTADOS
  // ==========================================

  const [boletas, setBoletas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [boletaExpandida, setBoletaExpandida] =
    useState(null);

  const [recarga, setRecarga] = useState(0);

  // ==========================================
  // CARGAR BOLETAS DESDE MYSQL
  // ==========================================

  useEffect(() => {

    if (!tienePermiso || !token) {

      setBoletas([]);
      setCargando(false);

      return;
    }

    const controller = new AbortController();

    const cargarBoletas = async () => {

      setCargando(true);
      setError("");

      try {

        // GET /api/v1/boletas
        // Solo ADMIN y VENDEDOR.

        const respuesta = await api.get(
          "/boletas",
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (controller.signal.aborted) return;

        const datos = respuesta.data;

        if (!Array.isArray(datos)) {
          throw new Error(
            "El backend no devolvió una lista de boletas."
          );
        }

        const ordenadas = [...datos].sort(
          (a, b) => Number(b.id) - Number(a.id)
        );

        setBoletas(ordenadas);

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error(
          "Error al cargar órdenes:",
          err
        );

        const estado = err.response?.status;

        if (estado === 401) {

          setError(
            "Tu sesión venció o cambió tu rol. " +
            "Cierra sesión e inicia nuevamente."
          );

        } else if (estado === 403) {

          setError(
            "No tienes permisos para consultar las órdenes."
          );

        } else {

          setError(
            "No se pudieron cargar las órdenes. " +
            "Comprueba que Spring Boot esté funcionando."
          );

        }

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false);
        }

      }
    };

    cargarBoletas();

    return () => controller.abort();

  }, [token, tienePermiso, recarga]);

  // ==========================================
  // MOSTRAR U OCULTAR DETALLES
  // ==========================================

  const alternarDetalle = (id) => {

    setBoletaExpandida((actual) =>
      actual === id ? null : id
    );

  };

  // ==========================================
  // ACCESO RESTRINGIDO
  // ==========================================

  if (!tienePermiso) {

    return (

      <div className="container py-5">

        <div className="alert alert-danger">
          Acceso exclusivo para administradores
          y vendedores.
        </div>

      </div>

    );
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div className="container py-4">

      {/* ENCABEZADO */}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

        <div>

          <h1 className="fw-bold text-success mb-2">

            {esAdmin
              ? "🧾 Administración de órdenes"
              : "🧾 Panel de órdenes"}

          </h1>

          <p className="text-muted mb-0">
            Compras registradas en Spring Boot y MySQL.
          </p>

        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          disabled={cargando}
          onClick={() => {
            setBoletaExpandida(null);
            setRecarga((actual) => actual + 1);
          }}
        >
          🔄 Actualizar
        </button>

      </div>

      {/* INDICADOR DE CARGA */}

      {cargando && (

        <div className="alert alert-info">
          Cargando órdenes desde MySQL...
        </div>

      )}

      {/* MENSAJE DE ERROR */}

      {error && (

        <div className="alert alert-danger" role="alert">
          {error}
        </div>

      )}

      {/* LISTADO VACIO */}

      {!cargando &&
        !error &&
        boletas.length === 0 && (

          <div className="alert alert-info">
            Todavía no hay órdenes registradas.
          </div>

        )}

      {/* LISTADO DE ORDENES */}

      {!cargando &&
        !error &&
        boletas.length > 0 && (

          <>

            {/* RESUMEN */}

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body p-4">

                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                  <div>

                    <p className="text-muted mb-1">
                      Órdenes registradas
                    </p>

                    <h2 className="fw-bold text-success mb-0">
                      {boletas.length}
                    </h2>

                  </div>

                  <div className="text-end">

                    <p className="text-muted mb-1">
                      Monto total registrado
                    </p>

                    <h3 className="fw-bold text-success mb-0">

                      ${formatoPrecio(
                        boletas.reduce(
                          (total, boleta) =>
                            total + Number(boleta.total ?? 0),
                          0
                        )
                      )}

                    </h3>

                    <small className="text-muted">
                      No implica pagos confirmados
                    </small>

                  </div>

                </div>

              </div>

            </div>

            {/* TABLA */}

            <div className="card border-0 shadow-sm">

              <div className="card-body p-4">

                <h4 className="fw-bold text-success mb-4">
                  📋 Listado de boletas
                </h4>

                <div className="table-responsive">

                  <table className="table table-hover align-middle">

                    <thead className="table-light">

                      <tr>
                        <th>Boleta</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>

                    </thead>

                    <tbody>

                      {boletas.map((boleta) => (

                        <tr key={boleta.id}>

                          <td className="fw-semibold">
                            #{boleta.id}
                          </td>

                          <td>
                            #{boleta.usuarioId}
                          </td>

                          <td>
                            {formatoFecha(boleta.fecha)}
                          </td>

                          <td className="fw-semibold text-success">
                            ${formatoPrecio(boleta.total)}
                          </td>

                          <td>

                            <span
                              className={
                                boleta.estado === "PENDIENTE"
                                  ? "badge bg-warning text-dark"
                                  : "badge bg-secondary"
                              }
                            >
                              {boleta.estado ?? "SIN ESTADO"}
                            </span>

                          </td>

                          <td>

                            <div className="d-flex gap-2 flex-wrap">

                              {/* DETALLE DESPLEGABLE */}
                              {/* ADMIN Y VENDEDOR */}

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                aria-expanded={
                                  boletaExpandida === boleta.id
                                }
                                onClick={() =>
                                  alternarDetalle(boleta.id)
                                }
                              >

                                {boletaExpandida === boleta.id
                                  ? "Ocultar detalle"
                                  : "Ver detalle"}

                              </button>

                              {/* PAGINA COMPLETA */}
                              {/* EXCLUSIVA PARA ADMIN */}

                              {esAdmin && (

                                <Link
                                  to={`/admin/ordenes/${boleta.id}`}
                                  className="btn btn-sm btn-success"
                                >
                                  📄 Ver boleta completa
                                </Link>

                              )}

                            </div>

                            {/* DETALLE DESPLEGABLE */}

                            {boletaExpandida === boleta.id && (

                              <div className="border rounded p-3 mt-3 bg-light">

                                <h6 className="fw-bold mb-3">
                                  Productos de la boleta
                                </h6>

                                {Array.isArray(boleta.detalles) &&
                                boleta.detalles.length > 0 ? (

                                  <div className="table-responsive">

                                    <table className="table table-sm mb-0">

                                      <thead>

                                        <tr>
                                          <th>Producto</th>
                                          <th>Cantidad</th>
                                          <th>Subtotal</th>
                                        </tr>

                                      </thead>

                                      <tbody>

                                        {boleta.detalles.map(
                                          (detalle, indice) => (

                                            <tr
                                              key={
                                                detalle.id ??
                                                `${detalle.productoId}-${indice}`
                                              }
                                            >

                                              <td>
                                                {detalle.nombreProducto}
                                              </td>

                                              <td>
                                                {detalle.cantidad}
                                              </td>

                                              <td>
                                                ${formatoPrecio(
                                                  detalle.subtotal
                                                )}
                                              </td>

                                            </tr>

                                          )
                                        )}

                                      </tbody>

                                    </table>

                                  </div>

                                ) : (

                                  <p className="text-muted mb-0">
                                    No hay detalles disponibles
                                    en el listado.
                                  </p>

                                )}

                              </div>

                            )}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

          </>

        )}

    </div>

  );

}
