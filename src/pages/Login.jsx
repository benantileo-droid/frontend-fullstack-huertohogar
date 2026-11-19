
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login({ onLogin }) {

  const navigate = useNavigate();

  // Obtener la funcion de login del contexto
  const { iniciarSesion } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  // Actualizar los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErrores({});
  };

  // Validar antes de enviar al backend
  const validar = () => {
    const nuevosErrores = {};

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      nuevosErrores.email = "El correo es obligatorio";
    } else if (!regexEmail.test(formData.email)) {
      nuevosErrores.email = "Ingresa un correo válido";
    }

    if (!formData.password) {
      nuevosErrores.password = "La contraseña es obligatoria";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  // Iniciar sesion desde Spring Boot
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validar() || cargando) return;

    setCargando(true);
    setErrores({});

    try {
      // Enviar correo y contraseña al backend
      const usuario = await iniciarSesion(
        formData.email.trim(),
        formData.password
      );

      // Mantener compatibilidad temporal con App.jsx
      if (onLogin) {
        onLogin(usuario);
      }

      // Ir a la tienda
      navigate("/");

    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      if (error.response?.status === 401) {
        setErrores({
          general: "Correo o contraseña incorrectos",
        });
      } else {
        setErrores({
          general:
            "No se pudo iniciar sesión. Comprueba que Spring Boot esté funcionando.",
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
                🌱 Iniciar Sesión
              </h2>

              <p className="text-muted text-center">
                Ingresa a tu cuenta de Huerto Hogar
              </p>

              {errores.general && (
                <div className="alert alert-danger">
                  {errores.general}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label
                    htmlFor="login-email"
                    className="form-label"
                  >
                    Correo electrónico
                  </label>

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    disabled={cargando}
                  />

                  {errores.email && (
                    <small className="text-danger">
                      {errores.email}
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="login-password"
                    className="form-label"
                  >
                    Contraseña
                  </label>

                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    disabled={cargando}
                  />

                  {errores.password && (
                    <small className="text-danger">
                      {errores.password}
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={cargando}
                >
                  {cargando
                    ? "Iniciando sesión..."
                    : "Ingresar"}
                </button>

              </form>

              <p className="text-center mt-3 mb-0">
                ¿No tienes una cuenta?{" "}
                <a href="/registro">
                  Regístrate aquí
                </a>
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
