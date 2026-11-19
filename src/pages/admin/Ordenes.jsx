
import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const formatoPrecio = (valor) =>
  Number(valor ?? 0).toLocaleString("es-CL");

const formatoFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? fecha
    : valor.toLocaleString("es-CL");
};

export default function Ordenes() {
  const { usuarioActual, token } = useAuth();

  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [ordenAbierta, setOrdenAbierta] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const puedeConsultar =
    usuarioActual?.rol === "admin" ||
    usuarioActual?.rol === "vendedor";

  useEffect(() => {
    if (!puedeConsultar || !token) {
      setOrdenes([]);
      setCargando(false);
      return;
    }

    const controller = new AbortController();

    const cargarOrdenes = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta = await api.get("/boletas", {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!controller.signal.aborted) {
          setOrdenes(
            Array.isArray(respuesta.data)
              ? respuesta.data
              : []
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error("Error al cargar órdenes:", err);

        if (err.response?.status === 401) {
          setError("Tu sesión venció. Inicia sesión nuevamente.");
        } else if (err.response?.status === 403) {
          setError("No tienes permisos para consultar las órdenes.");
        } else {
          setError("No se pudieron cargar las órdenes desde MySQL.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarOrdenes();

    return () => controller.abort();
  }, [token, puedeConsultar, recarga]);

  const texto = busqueda.trim().toLowerCase();

  const ordenesFiltradas = ordenes.filter(
    (orden) =>
      String(orden.id).includes(texto) ||
      String(orden.usuarioId).includes(texto) ||
      String(orden.estado ?? "").toLowerCase().includes(texto)
  );

  if (!puedeConsultar) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          No tienes permisos para consultar las órdenes.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold text-success">
            🧾 Órdenes / Boletas
          </h1>

          <p className="text-muted">
            Compras registradas en MySQL.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          disabled={cargando}
          onClick={() => setRecarga((n) => n + 1)}
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <p className="text-muted mb-1">
            Total de órdenes registradas
          </p>

          <h2 className="fw-bold text-success mb-0">
            {ordenes.length}
          </h2>
        </div>
      </div>

      <input
        type="text"
        className="form-control mb-4"
        placeholder="🔍 Buscar por número, usuario o estado..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {cargando && (
        <div className="alert alert-info">
          Cargando órdenes desde MySQL...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {!cargando &&
        !error &&
        ordenesFiltradas.length === 0 && (
          <div className="alert alert-secondary">
            No hay órdenes para mostrar.
          </div>
        )}

      {!cargando &&
        !error &&
        ordenesFiltradas.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead>
                    <tr>
                      <th>Boleta</th>
                      <th>ID Cliente</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ordenesFiltradas.map((orden) => (
                      <tr key={orden.id}>

                        <td className="fw-bold">
                          #{orden.id}
                        </td>

                        <td>{orden.usuarioId}</td>

                        <td>{formatoFecha(orden.fecha)}</td>

                        <td>
                          <span className="badge bg-warning text-dark">
                            {orden.estado}
                          </span>
                        </td>

                        <td className="fw-bold text-success">
                          ${formatoPrecio(orden.total)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={() =>
                              setOrdenAbierta(
                                ordenAbierta === orden.id
                                  ? null
                                  : orden.id
                              )
                            }
                          >
                            {ordenAbierta === orden.id
                              ? "Ocultar detalle"
                              : "Ver detalle"}
                          </button>

                          {ordenAbierta === orden.id && (
                            <div className="mt-3 p-3 bg-light border rounded">

                              <h6 className="fw-bold">
                                Productos comprados
                              </h6>

                              {(orden.detalles || []).map(
                                (detalle) => (
                                  <div
                                    key={detalle.id}
                                    className="border-bottom py-2"
                                  >
                                    <strong>
                                      {detalle.nombreProducto}
                                    </strong>

                                    <div className="small text-muted">
                                      Cantidad: {detalle.cantidad}
                                    </div>

                                    <div className="small">
                                      Precio: $
                                      {formatoPrecio(
                                        detalle.precioUnitario
                                      )}
                                    </div>

                                    <div className="small fw-bold">
                                      Subtotal: $
                                      {formatoPrecio(
                                        detalle.subtotal
                                      )}
                                    </div>
                                  </div>
                                )
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
        )}
    </div>
  );
}
