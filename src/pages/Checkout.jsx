
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { regiones } from "../data/regiones";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatoPrecio = (valor) =>
  Number(valor).toLocaleString("es-CL");

function Campo({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  requerido = true,
  disabled = false,
}) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label fw-semibold">
        {label}
        {requerido && <span className="text-danger"> *</span>}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        className={`form-control ${error ? "is-invalid" : ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />

      {error && (
        <div className="invalid-feedback">{error}</div>
      )}
    </div>
  );
}

export default function Checkout({
  carrito = [],
  onClearCart,
}) {
  const navigate = useNavigate();

  const { usuarioActual, autenticado } = useAuth();

  const [datos, setDatos] = useState({
    nombre:
      usuarioActual?.nombre?.includes("@")
        ? ""
        : usuarioActual?.nombre || "",
    apellidos: "",
    correo: usuarioActual?.correo || "",
    calle: "",
    departamento: "",
    region: "",
    comuna: "",
    indicaciones: "",
    tipoEntrega: "Despacho estándar (3 a 5 días)",
  });

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const comunasDisponibles =
    regiones.find((r) => r.nombre === datos.region)
      ?.comunas || [];

  // Este total es solo visual.
  // Spring Boot calculara el total real.
  const totalEstimado = carrito.reduce(
    (total, producto) =>
      total + producto.precio * producto.cantidad,
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setDatos((anterior) =>
      name === "region"
        ? { ...anterior, region: value, comuna: "" }
        : { ...anterior, [name]: value }
    );

    setErrores((anterior) => ({
      ...anterior,
      [name]: "",
    }));

    setErrorGeneral("");
  };

  // Validar los datos de entrega
  const validar = () => {
    const nuevos = {};

    if (!datos.nombre.trim()) {
      nuevos.nombre = "El nombre es obligatorio";
    }

    if (!datos.apellidos.trim()) {
      nuevos.apellidos = "Los apellidos son obligatorios";
    }

    if (!datos.correo.trim()) {
      nuevos.correo = "El correo es obligatorio";
    } else if (!regexEmail.test(datos.correo.trim())) {
      nuevos.correo = "El correo no es válido";
    }

    if (!datos.calle.trim()) {
      nuevos.calle = "La calle es obligatoria";
    }

    if (!datos.region) {
      nuevos.region = "Selecciona una región";
    }

    if (!datos.comuna) {
      nuevos.comuna = "Selecciona una comuna";
    }

    setErrores(nuevos);

    return Object.keys(nuevos).length === 0;
  };

  // Registrar la compra en Spring Boot
  const confirmarCompra = async () => {
    if (cargando) return;

    setErrorGeneral("");

    if (!autenticado) {
      setErrorGeneral(
        "Debes iniciar sesión para registrar tu pedido."
      );
      return;
    }

    if (!validar()) return;

    if (carrito.length === 0) {
      setErrorGeneral("Tu carrito está vacío.");
      return;
    }

    // Comprobar cantidades antes de enviar
    const cantidadesValidas = carrito.every(
      (producto) =>
        Number.isInteger(producto.id) &&
        Number.isInteger(producto.cantidad) &&
        producto.cantidad > 0
    );

    if (!cantidadesValidas) {
      setErrorGeneral(
        "El carrito contiene productos o cantidades inválidas."
      );
      return;
    }

    setCargando(true);

    try {
      // Enviar solamente IDs y cantidades.
      // El backend obtiene los precios desde MySQL.
      const solicitud = {
        detalles: carrito.map((producto) => ({
          productoId: producto.id,
          cantidad: producto.cantidad,
        })),
      };

      const respuesta = await api.post(
        "/boletas",
        solicitud
      );

      // Boleta confirmada por Spring Boot
      const boleta = respuesta.data;

      // Adaptar la respuesta a la vista
      // CompraExitosa que ya tiene el proyecto.
      const orden = {
        numero: `BOLETA-${boleta.id}`,
        fecha: new Date(boleta.fecha).toLocaleString(
          "es-CL"
        ),
        nombre: `${datos.nombre} ${datos.apellidos}`.trim(),
        correo: datos.correo.trim(),
        direccion:
          datos.calle.trim() +
          (datos.departamento.trim()
            ? `, Depto ${datos.departamento.trim()}`
            : ""),
        region: datos.region,
        comuna: datos.comuna,
        indicaciones: datos.indicaciones,
        tipoEntrega: datos.tipoEntrega,
        estado: boleta.estado,
        productos: boleta.detalles.map((detalle) => ({
          id: detalle.productoId,
          nombre: detalle.nombreProducto,
          precio: detalle.precioUnitario,
          cantidad: detalle.cantidad,
          subtotal: detalle.subtotal,
        })),
        total: boleta.total,
      };

      // Conservar temporalmente la información
      // para mostrar la confirmación de pedido.
      try {
        localStorage.setItem(
          "ultimaOrden",
          JSON.stringify(orden)
        );
      } catch (errorAlGuardar) {
        console.warn(
          "No se pudo guardar el resumen local:",
          errorAlGuardar
        );
      }

      // Solo vaciar después del éxito del backend
      onClearCart();

      // Ir a la confirmación
      navigate("/compra-exitosa");

    } catch (error) {
      console.error("Error al registrar pedido:", error);

      const estado = error.response?.status;

      if (estado === 409) {
        setErrorGeneral(
          "Stock insuficiente. Revisa las cantidades del carrito."
        );
      } else if (estado === 401) {
        setErrorGeneral(
          "Tu sesión venció. Inicia sesión nuevamente."
        );
      } else if (estado === 403) {
        setErrorGeneral(
          "Tu usuario no tiene permiso para registrar pedidos."
        );
      } else if (estado === 404) {
        setErrorGeneral(
          "Uno de los productos ya no existe."
        );
      } else if (estado === 400) {
        setErrorGeneral(
          "La solicitud contiene datos incorrectos."
        );
      } else {
        setErrorGeneral(
          "No se pudo confirmar el pedido. Revisa Mis Compras antes de reintentar, por si el servidor alcanzó a registrarlo."
        );
      }
    } finally {
      setCargando(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div className="container py-5">
        <div className="alert alert-info">
          Tu carrito está vacío.{" "}
          <Link to="/productos">Ver productos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">

              <h1 className="fw-bold text-success h3 mb-2">
                Confirmar pedido
              </h1>

              <p className="text-muted">
                Completa tus datos para registrar la compra.
              </p>

              {!autenticado && (
                <div className="alert alert-warning">
                  Debes{" "}
                  <Link to="/login">iniciar sesión</Link>
                  {" "}antes de confirmar tu pedido.
                </div>
              )}

              {errorGeneral && (
                <div className="alert alert-danger" role="alert">
                  {errorGeneral}
                </div>
              )}

              <div className="alert alert-info">
                El pedido quedará en estado{" "}
                <strong>PENDIENTE</strong>.
                Este formulario no procesa pagos reales.
              </div>

              {/* RESUMEN DEL CARRITO */}
              <h5 className="fw-bold mt-4">
                Resumen de productos
              </h5>

              <div className="table-responsive mb-3">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio estimado</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {carrito.map((producto) => (
                      <tr key={producto.id}>
                        <td>{producto.nombre}</td>
                        <td>
                          ${formatoPrecio(producto.precio)}
                        </td>
                        <td>{producto.cantidad}</td>
                        <td>
                          ${formatoPrecio(
                            producto.precio * producto.cantidad
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-end mb-4">
                <strong>
                  Total estimado: $
                  {formatoPrecio(totalEstimado)}
                </strong>
                <p className="text-muted small">
                  El total definitivo lo calcula Spring Boot.
                </p>
              </div>

              {/* INFORMACION DEL CLIENTE */}
              <h5 className="fw-bold">
                Información del cliente
              </h5>

              <div className="row">
                <div className="col-md-6">
                  <Campo
                    label="Nombre"
                    name="nombre"
                    value={datos.nombre}
                    onChange={handleChange}
                    error={errores.nombre}
                    disabled={cargando}
                  />
                </div>

                <div className="col-md-6">
                  <Campo
                    label="Apellidos"
                    name="apellidos"
                    value={datos.apellidos}
                    onChange={handleChange}
                    error={errores.apellidos}
                    disabled={cargando}
                  />
                </div>
              </div>

              <Campo
                label="Correo"
                name="correo"
                type="email"
                value={datos.correo}
                onChange={handleChange}
                error={errores.correo}
                disabled={cargando}
              />

              {/* DIRECCION */}
              <h5 className="fw-bold mt-3">
                Dirección de entrega
              </h5>

              <div className="row">
                <div className="col-md-8">
                  <Campo
                    label="Calle"
                    name="calle"
                    value={datos.calle}
                    onChange={handleChange}
                    error={errores.calle}
                    disabled={cargando}
                  />
                </div>

                <div className="col-md-4">
                  <Campo
                    label="Departamento"
                    name="departamento"
                    value={datos.departamento}
                    onChange={handleChange}
                    placeholder="Ej: 603"
                    requerido={false}
                    disabled={cargando}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Región *
                  </label>

                  <select
                    name="region"
                    className={`form-select ${
                      errores.region ? "is-invalid" : ""
                    }`}
                    value={datos.region}
                    onChange={handleChange}
                    disabled={cargando}
                  >
                    <option value="">
                      Selecciona una región
                    </option>

                    {regiones.map((region) => (
                      <option
                        key={region.nombre}
                        value={region.nombre}
                      >
                        {region.nombre}
                      </option>
                    ))}
                  </select>

                  {errores.region && (
                    <div className="invalid-feedback">
                      {errores.region}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Comuna *
                  </label>

                  <select
                    name="comuna"
                    className={`form-select ${
                      errores.comuna ? "is-invalid" : ""
                    }`}
                    value={datos.comuna}
                    onChange={handleChange}
                    disabled={!datos.region || cargando}
                  >
                    <option value="">
                      Selecciona una comuna
                    </option>

                    {comunasDisponibles.map((comuna) => (
                      <option key={comuna} value={comuna}>
                        {comuna}
                      </option>
                    ))}
                  </select>

                  {errores.comuna && (
                    <div className="invalid-feedback">
                      {errores.comuna}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Indicaciones de entrega
                </label>

                <textarea
                  name="indicaciones"
                  className="form-control"
                  rows={2}
                  value={datos.indicaciones}
                  onChange={handleChange}
                  placeholder="Opcional"
                  disabled={cargando}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Opción de entrega
                </label>

                <select
                  name="tipoEntrega"
                  className="form-select"
                  value={datos.tipoEntrega}
                  onChange={handleChange}
                  disabled={cargando}
                >
                  <option>
                    Despacho estándar (3 a 5 días)
                  </option>
                  <option>
                    Despacho express (24 horas)
                  </option>
                </select>
              </div>

              <div className="text-end">
                <button
                  type="button"
                  className="btn btn-success rounded-pill px-4"
                  onClick={confirmarCompra}
                  disabled={cargando || !autenticado}
                >
                  {cargando
                    ? "Registrando pedido..."
                    : "Confirmar pedido"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
