
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const formatoPrecio = (valor) => {
  return Number(valor ?? 0).toLocaleString("es-CL");
};

const formatoFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return fecha;
  }

  return fechaConvertida.toLocaleString("es-CL");
};

export default function Dashboard() {

  // ==========================================
  // AUTENTICACION
  // ==========================================

  const { usuarioActual, token } = useAuth();

  // ==========================================
  // ESTADOS
  // ==========================================

  const [productos, setProductos] = useState([]);
  const [boletas, setBoletas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [recarga, setRecarga] = useState(0);

  const esAdmin = usuarioActual?.rol === "admin";

  // ==========================================
  // OBTENER DATOS REALES DESDE SPRING BOOT
  // ==========================================

  useEffect(() => {

    if (!esAdmin || !token) {
      setProductos([]);
      setBoletas([]);
      setCargando(false);
      return;
    }

    const controller = new AbortController();

    const cargarDashboard = async () => {

      setCargando(true);
      setError("");

      try {

        // Productos desde MySQL
        // Boletas desde MySQL, utilizando JWT

        const [
          respuestaProductos,
          respuestaBoletas,
        ] = await Promise.all([

          api.get("/productos", {
            signal: controller.signal,
          }),

          api.get("/boletas", {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

        ]);

        if (controller.signal.aborted) return;

        if (
          !Array.isArray(respuestaProductos.data) ||
          !Array.isArray(respuestaBoletas.data)
        ) {
          throw new Error(
            "La API devolvió un formato inesperado."
          );
        }

        setProductos(respuestaProductos.data);
        setBoletas(respuestaBoletas.data);

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error(
          "Error al cargar Dashboard:",
          err
        );

        if (err.response?.status === 401) {

          setError(
            "Tu sesión venció. Inicia sesión nuevamente."
          );

        } else if (err.response?.status === 403) {

          setError(
            "No tienes permisos para consultar las estadísticas."
          );

        } else {

          setError(
            "No se pudieron cargar los datos del Dashboard."
          );

        }

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false);
        }

      }
    };

    cargarDashboard();

    return () => controller.abort();

  }, [token, esAdmin, recarga]);

  // ==========================================
  // ESTADISTICAS DE BOLETAS
  // ==========================================

  const totalOrdenes = boletas.length;

  const montoPedidos = boletas.reduce(
    (acumulado, boleta) => {
      return acumulado + Number(boleta.total ?? 0);
    },
    0
  );

  const ordenesPendientes = boletas.filter(
    (boleta) =>
      String(boleta.estado ?? "").toUpperCase() ===
      "PENDIENTE"
  ).length;

  const ordenesRecientes = [...boletas]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  // ==========================================
  // ESTADISTICAS DE PRODUCTOS
  // ==========================================

  const totalProductos = productos.length;

  const stockCritico = productos.filter(
    (producto) => {
      const stock = Number(producto.stock);

      return (
        producto.stock != null &&
        Number.isFinite(stock) &&
        stock >= 0 &&
        stock <= 5
      );
    }
  );

  const productosSinStock = productos.filter(
    (producto) =>
      producto.stock != null &&
      Number(producto.stock) === 0
  ).length;

  const productosCriticos = stockCritico.length;

  // ==========================================
  // RESTRICCION DE ACCESO
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
  // INTERFAZ DEL DASHBOARD
  // ==========================================

  return (

    <div className="container-fluid py-4">

      {/* ENCABEZADO */}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

        <div>

          <h1 className="fw-bold text-success mb-2">
            📊 Dashboard
          </h1>

          <p className="text-muted mb-0">
            Resumen de Huerto Hogar con datos de MySQL.
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

      {/* CARGANDO */}

      {cargando && (
        <div className="alert alert-info">
          Cargando estadísticas desde MySQL...
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {!cargando && !error && (

        <>

          {/* TARJETAS DE ESTADISTICAS */}

          <div className="row g-4 mb-4">

            {/* TOTAL DE ORDENES */}

            <div className="col-md-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body p-4">

                  <p className="text-muted mb-2">
                    🛒 Pedidos registrados
                  </p>

                  <h2 className="fw-bold text-success">
                    {totalOrdenes}
                  </h2>

                  <Link
                    to="/admin/ordenes"
                    className="text-success small"
                  >
                    Ver órdenes
                  </Link>

                </div>

              </div>

            </div>

            {/* MONTO TOTAL */}

            <div className="col-md-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body p-4">

                  <p className="text-muted mb-2">
                    💰 Monto de pedidos
                  </p>

                  <h2 className="fw-bold text-success">
                    ${formatoPrecio(montoPedidos)}
                  </h2>

                  <small className="text-muted">
                    Total registrado, no necesariamente pagado
                  </small>

                </div>

              </div>

            </div>

            {/* ORDENES PENDIENTES */}

            <div className="col-md-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body p-4">

                  <p className="text-muted mb-2">
                    ⏳ Pedidos pendientes
                  </p>

                  <h2 className="fw-bold text-warning">
                    {ordenesPendientes}
                  </h2>

                  <small className="text-muted">
                    Estado PENDIENTE en MySQL
                  </small>

                </div>

              </div>

            </div>

            {/* PRODUCTOS CRITICOS */}

            <div className="col-md-6 col-xl-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body p-4">

                  <p className="text-muted mb-2">
                    ⚠️ Productos críticos
                  </p>

                  <h2 className="fw-bold text-danger">
                    {productosCriticos}
                  </h2>

                  <Link
                    to="/admin/productos-criticos"
                    className="text-success small"
                  >
                    Revisar productos
                  </Link>

                </div>

              </div>

            </div>

          </div>

          {/* RESUMEN DE INVENTARIO */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <h4 className="fw-bold text-success mb-4">
                📦 Resumen de inventario
              </h4>

              <div className="row text-center g-3">

                <div className="col-md-4">

                  <h3 className="fw-bold">
                    {totalProductos}
                  </h3>

                  <p className="text-muted mb-0">
                    Productos registrados
                  </p>

                </div>

                <div className="col-md-4">

                  <h3 className="fw-bold text-warning">
                    {productosCriticos}
                  </h3>

                  <p className="text-muted mb-0">
                    Stock crítico (0 a 5)
                  </p>

                </div>

                <div className="col-md-4">

                  <h3 className="fw-bold text-danger">
                    {productosSinStock}
                  </h3>

                  <p className="text-muted mb-0">
                    Productos agotados
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ULTIMAS ORDENES */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">

                <h4 className="fw-bold text-success mb-0">
                  🧾 Últimas órdenes
                </h4>

                <Link
                  to="/admin/ordenes"
                  className="btn btn-outline-success btn-sm"
                >
                  Ver todas
                </Link>

              </div>

              {ordenesRecientes.length === 0 ? (

                <div className="alert alert-info">
                  Todavía no hay órdenes registradas.
                </div>

              ) : (

                <div className="table-responsive">

                  <table className="table table-hover align-middle">

                    <thead>

                      <tr>
                        <th>Boleta</th>
                        <th>Cliente ID</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                      </tr>

                    </thead>

                    <tbody>

                      {ordenesRecientes.map((boleta) => (

                        <tr key={boleta.id}>

                          <td className="fw-bold">
                            #{boleta.id}
                          </td>

                          <td>
                            {boleta.usuarioId}
                          </td>

                          <td>
                            {formatoFecha(boleta.fecha)}
                          </td>

                          <td>

                            <span
                              className={
                                String(
                                  boleta.estado ?? ""
                                ).toUpperCase() === "PENDIENTE"
                                  ? "badge bg-warning text-dark"
                                  : "badge bg-secondary"
                              }
                            >
                              {boleta.estado}
                            </span>

                          </td>

                          <td className="fw-bold text-success">
                            ${formatoPrecio(boleta.total)}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

          {/* ACCESOS RAPIDOS */}

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4">

              <h4 className="fw-bold text-success mb-3">
                ⚙️ Accesos rápidos
              </h4>

              <div className="d-flex flex-wrap gap-2">

                <Link
                  to="/admin/ordenes"
                  className="btn btn-success"
                >
                  🧾 Órdenes
                </Link>

                <Link
                  to="/admin/productos"
                  className="btn btn-outline-success"
                >
                  📦 Productos
                </Link>

                <Link
                  to="/admin/productos-criticos"
                  className="btn btn-outline-warning"
                >
                  ⚠️ Stock crítico
                </Link>

                <Link
                  to="/admin/usuarios"
                  className="btn btn-outline-secondary"
                >
                  👥 Usuarios
                </Link>

                <Link
                  to="/admin/categorias"
                  className="btn btn-outline-secondary"
                >
                  🏷️ Categorías
                </Link>

              </div>

            </div>

          </div>

        </>

      )}

    </div>

  );
}
