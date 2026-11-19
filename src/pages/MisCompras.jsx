
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const formatoPrecio = (valor) =>
  Number(valor ?? 0).toLocaleString("es-CL");

const formatoFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return fecha;
  }

  return fechaConvertida.toLocaleString("es-CL");
};

export default function MisCompras() {

  const { autenticado, token } = useAuth();

  const [boletas, setBoletas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [boletaAbierta, setBoletaAbierta] = useState(null);

  useEffect(() => {

    if (!autenticado || !token) {
      setBoletas([]);
      setCargando(false);
      return;
    }

    const controller = new AbortController();

    const cargarCompras = async () => {

      setCargando(true);
      setError("");
      setBoletas([]);

      try {

        const respuesta = await api.get(
          "/boletas/mis-compras",
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!controller.signal.aborted) {
          setBoletas(respuesta.data);
        }

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error("Error al obtener compras:", err);

        if (err.response?.status === 401) {
          setError(
            "Tu sesión venció. Inicia sesión nuevamente."
          );
        } else {
          setError(
            "No se pudo cargar tu historial de compras."
          );
        }

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false);
        }

      }
    };

    cargarCompras();

    return () => controller.abort();

  }, [autenticado, token]);

  // Usuario sin sesión
  if (!autenticado) {
    return (
      <div className="container py-5 text-center">
        <h2>🛍️ Mis Compras</h2>

        <div className="alert alert-warning mt-4">
          Debes iniciar sesión para ver tus compras.
        </div>

        <Link to="/login" className="btn btn-success">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">

      <h1 className="fw-bold text-success mb-2">
        🛍️ Mis Compras
      </h1>

      <p className="text-muted mb-4">
        Consulta tus pedidos registrados en Huerto Hogar.
      </p>

      {cargando && (
        <div className="alert alert-info">
          Cargando tus compras...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {!cargando && !error && boletas.length === 0 && (
        <div className="alert alert-info">
          Todavía no tienes compras registradas.

          <div className="mt-3">
            <Link
              to="/productos"
              className="btn btn-success"
            >
              Ver productos
            </Link>
          </div>
        </div>
      )}

      {!cargando && !error && boletas.map((boleta) => (

        <div
          className="card shadow-sm border-0 mb-4"
          key={boleta.id}
        >

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">

              <div>
                <h5 className="fw-bold mb-1">
                  Boleta N.º {boleta.id}
                </h5>

                <p className="text-muted mb-2">
                  {formatoFecha(boleta.fecha)}
                </p>

                <span className="badge bg-warning text-dark">
                  {boleta.estado}
                </span>
              </div>

              <div className="text-end">
                <p className="mb-1 text-muted">
                  Total del pedido
                </p>

                <h4 className="fw-bold text-success">
                  ${formatoPrecio(boleta.total)}
                </h4>
              </div>

            </div>

            <hr />

            <button
              type="button"
              className="btn btn-outline-success"
              onClick={() =>
                setBoletaAbierta(
                  boletaAbierta === boleta.id
                    ? null
                    : boleta.id
                )
              }
            >
              {boletaAbierta === boleta.id
                ? "Ocultar productos"
                : "Ver productos comprados"}
            </button>

            {boletaAbierta === boleta.id && (

              <div className="table-responsive mt-4">
                <table className="table table-striped">

                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(boleta.detalles || []).map((detalle) => (

                      <tr key={detalle.id}>
                        <td>{detalle.nombreProducto}</td>
                        <td>{detalle.cantidad}</td>

                        <td>
                          ${formatoPrecio(
                            detalle.precioUnitario
                          )}
                        </td>

                        <td>
                          ${formatoPrecio(detalle.subtotal)}
                        </td>
                      </tr>

                    ))}
                  </tbody>

                </table>
              </div>

            )}

          </div>
        </div>

      ))}

    </div>
  );
}
