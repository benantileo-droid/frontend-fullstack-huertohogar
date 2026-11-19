
import { useState } from "react";
import { Link } from "react-router-dom";

// Formato de dinero chileno
const formatoPrecio = (valor) => {
  return Number(valor ?? 0).toLocaleString("es-CL");
};

// Recuperar el ultimo pedido guardado
function obtenerUltimaOrden() {
  try {
    const guardada = localStorage.getItem("ultimaOrden");

    if (!guardada) {
      return null;
    }

    const orden = JSON.parse(guardada);

    if (!orden || typeof orden !== "object") {
      return null;
    }

    return orden;

  } catch (error) {
    console.error("Error al leer la ultima orden:", error);
    return null;
  }
}

export default function CompraExitosa() {

  const [orden] = useState(obtenerUltimaOrden);

  // Si no existe una compra guardada
  if (!orden) {
    return (
      <div className="container py-5">
        <div className="alert alert-info text-center">
          <h4>No hay un pedido reciente para mostrar</h4>

          <p>
            Cuando registres una compra,
            podrás consultar aquí su resumen.
          </p>

          <Link
            to="/productos"
            className="btn btn-success"
          >
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  const productos = Array.isArray(orden.productos)
    ? orden.productos
    : [];

  const estado = orden.estado || "SIN ESTADO";

  return (
    <div className="container py-5">

      <div className="row justify-content-center">
        <div className="col-lg-8">

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4 p-md-5">

              {/* CONFIRMACION */}

              <div className="text-center mb-4">

                <div className="display-1 mb-3">
                  ✅
                </div>

                <h1 className="fw-bold text-success">
                  ¡Pedido registrado correctamente!
                </h1>

                <p className="text-muted mt-3">
                  Huerto Hogar recibió tu pedido.
                </p>

                <span className="badge bg-warning text-dark fs-6">
                  Estado: {estado}
                </span>

                <p className="small text-muted mt-3">
                  Tu pedido fue registrado en el sistema.
                  Esto no significa que se haya realizado
                  un pago.
                </p>

              </div>

              {/* DATOS DE LA BOLETA */}

              <div className="border-top pt-3">

                <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">

                  <strong>
                    Pedido: {orden.numero}
                  </strong>

                  <span className="text-muted">
                    {orden.fecha}
                  </span>

                </div>

                {/* DATOS DE ENTREGA */}

                <h5 className="fw-bold mt-4">
                  Datos de entrega
                </h5>

                <p className="mb-1">
                  <strong>Cliente:</strong>{" "}
                  {orden.nombre}
                </p>

                <p className="mb-1">
                  <strong>Correo:</strong>{" "}
                  {orden.correo}
                </p>

                <p className="mb-1">
                  <strong>Dirección:</strong>{" "}
                  {orden.direccion}
                </p>

                <p className="mb-1">
                  <strong>Comuna:</strong>{" "}
                  {orden.comuna}
                </p>

                <p className="mb-1">
                  <strong>Región:</strong>{" "}
                  {orden.region}
                </p>

                {orden.indicaciones && (
                  <p className="mb-1">
                    <strong>Indicaciones:</strong>{" "}
                    {orden.indicaciones}
                  </p>
                )}

                <p className="mb-3">
                  <strong>Tipo de entrega:</strong>{" "}
                  {orden.tipoEntrega}
                </p>

                {/* PRODUCTOS COMPRADOS */}

                <h5 className="fw-bold mt-4">
                  Productos del pedido
                </h5>

                <div className="table-responsive">

                  <table className="table table-striped align-middle">

                    <thead className="table-light">
                      <tr>
                        <th>Producto</th>
                        <th>Precio unitario</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {productos.map((producto, indice) => (
                        <tr
                          key={`${producto.id}-${indice}`}
                        >
                          <td>{producto.nombre}</td>

                          <td>
                            ${formatoPrecio(producto.precio)}
                          </td>

                          <td>
                            {producto.cantidad}
                          </td>

                          <td>
                            ${formatoPrecio(
                              producto.subtotal ??
                              producto.precio * producto.cantidad
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>

                {/* TOTAL */}

                <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">

                  <h5 className="fw-bold mb-0">
                    Total del pedido:
                  </h5>

                  <h4 className="fw-bold text-success mb-0">
                    ${formatoPrecio(orden.total)}
                  </h4>

                </div>

                <div className="alert alert-info mt-4">
                  <strong>Importante:</strong>{" "}
                  Este documento es un resumen del
                  pedido y no una boleta tributaria
                  ni un comprobante de pago.
                </div>

              </div>

              {/* BOTONES */}

              <div className="text-center mt-4 d-print-none">

                <button
                  type="button"
                  className="btn btn-outline-success me-2 mb-2"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir / Guardar PDF
                </button>

                <Link
                  to="/productos"
                  className="btn btn-success mb-2"
                >
                  🛒 Seguir comprando
                </Link>

              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
