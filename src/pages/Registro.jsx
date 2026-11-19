
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Registro() {

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Actualizar los datos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErrores({});
  };

  // Validar el formulario
  const validar = () => {
    const nuevosErrores = {};

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    }

    if (!formData.correo.trim()) {
      nuevosErrores.correo = "El correo es obligatorio";
    } else if (!regexCorreo.test(formData.correo.trim())) {
      nuevosErrores.correo = "Ingresa un correo válido";
    }

    if (formData.password.length < 8) {
      nuevosErrores.password =
        "La contraseña debe tener al menos 8 caracteres";
    } else if (formData.password.length > 64) {
      nuevosErrores.password =
        "La contraseña no puede superar los 64 caracteres";
    }

    if (formData.password !== formData.confirmarPassword) {
      nuevosErrores.confirmarPassword =
        "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  // Registrar usuario en Spring Boot
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validar() || cargando) return;

    setCargando(true);
    setRegistroExitoso(false);
    setErrores({});

    try {
      await api.post("/auth/registro", {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim().toLowerCase(),
        password: formData.password,
      });

      // Usuario registrado correctamente
      setRegistroExitoso(true);

      setFormData({
        nombre: "",
        correo: "",
        password: "",
        confirmarPassword: "",
      });

    } catch (error) {

      if (error.response?.status === 409) {
        setErrores({
          general: "Este correo ya está registrado",
        });

      } else if (error.response?.status === 400) {
        setErrores({
          general:
            "Revisa los datos ingresados e inténtalo nuevamente",
        });

      } else {
        setErrores({
          general:
            "No se pudo registrar el usuario. Comprueba que Spring Boot esté funcionando.",
        });
      }

    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">

      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">

          <div className="card shadow-sm">
            <div className="card-body p-4">

              <h2 className="text-center mb-4">
                🌱 Crear Cuenta
              </h2>

              <p className="text-center text-muted">
                Regístrate en Huerto Hogar
              </p>

              {registroExitoso && (
                <div className="alert alert-success">
                  <strong>¡Registro exitoso!</strong>
                  <p className="mb-2">
                    Tu cuenta fue creada correctamente.
                  </p>
                  <Link to="/login" className="alert-link">
                    Iniciar sesión
                  </Link>
                </div>
              )}

              {errores.general && (
                <div className="alert alert-danger">
                  {errores.general}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label
                    htmlFor="registro-nombre"
                    className="form-label"
                  >
                    Nombre completo
                  </label>

                  <input
                    id="registro-nombre"
                    type="text"
                    name="nombre"
                    className="form-control"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ingresa tu nombre"
                    autoComplete="name"
                    disabled={cargando}
                  />

                  {errores.nombre && (
                    <small className="text-danger">
                      {errores.nombre}
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="registro-correo"
                    className="form-label"
                  >
                    Correo electrónico
                  </label>

                  <input
                    id="registro-correo"
                    type="email"
                    name="correo"
                    className="form-control"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    disabled={cargando}
                  />

                  {errores.correo && (
                    <small className="text-danger">
                      {errores.correo}
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="registro-password"
                    className="form-label"
                  >
                    Contraseña
                  </label>

                  <input
                    id="registro-password"
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    disabled={cargando}
                  />

                  {errores.password && (
                    <small className="text-danger">
                      {errores.password}
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="registro-confirmar"
                    className="form-label"
                  >
                    Confirmar contraseña
                  </label>

                  <input
                    id="registro-confirmar"
                    type="password"
                    name="confirmarPassword"
                    className="form-control"
                    value={formData.confirmarPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    disabled={cargando}
                  />

                  {errores.confirmarPassword && (
                    <small className="text-danger">
                      {errores.confirmarPassword}
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={cargando}
                >
                  {cargando
                    ? "Registrando..."
                    : "Crear cuenta"}
                </button>

              </form>

              <p className="text-center mt-3 mb-0">
                ¿Ya tienes una cuenta?{" "}
                <Link to="/login">
                  Inicia sesión
                </Link>
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
