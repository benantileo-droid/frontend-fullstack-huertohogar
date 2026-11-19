
import { useEffect, useState } from "react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function UsuariosAdmin() {

  // ==========================================
  // AUTENTICACION
  // ==========================================

  const { usuarioActual, token } = useAuth();

  const esAdmin = usuarioActual?.rol === "admin";

  // ==========================================
  // ESTADOS
  // ==========================================

  const [usuarios, setUsuarios] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [recarga, setRecarga] = useState(0);

  // ==========================================
  // CONSULTAR USUARIOS DESDE MYSQL
  // ==========================================

  useEffect(() => {

    if (!esAdmin || !token) {
      setUsuarios([]);
      setCargando(false);
      return;
    }

    const controller = new AbortController();

    const cargarUsuarios = async () => {

      setCargando(true);
      setError("");

      try {

        // GET /api/v1/admin/usuarios

        const respuesta = await api.get(
          "/admin/usuarios",
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (controller.signal.aborted) return;

        if (!Array.isArray(respuesta.data)) {
          throw new Error(
            "La API devolvió un formato inesperado."
          );
        }

        setUsuarios(respuesta.data);

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error(
          "Error al cargar usuarios:",
          err
        );

        const estado = err.response?.status;

        if (estado === 401) {

          setError(
            "Tu sesión venció. Inicia sesión nuevamente."
          );

        } else if (estado === 403) {

          setError(
            "No tienes permisos para consultar usuarios."
          );

        } else {

          setError(
            "No se pudieron cargar los usuarios desde MySQL."
          );

        }

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false);
        }

      }

    };

    cargarUsuarios();

    return () => controller.abort();

  }, [esAdmin, token, recarga]);

  // ==========================================
  // BUSCAR USUARIOS
  // ==========================================

  const texto = busqueda.trim().toLowerCase();

  const usuariosFiltrados = usuarios.filter(
    (usuario) => {

      const nombre = String(
        usuario.nombre ?? ""
      ).toLowerCase();

      const correo = String(
        usuario.correo ?? ""
      ).toLowerCase();

      const rol = String(
        usuario.rol ?? ""
      ).toLowerCase();

      const id = String(usuario.id ?? "");

      return (
        nombre.includes(texto) ||
        correo.includes(texto) ||
        rol.includes(texto) ||
        id.includes(texto)
      );
    }
  );

  // ==========================================
  // CONTADORES
  // ==========================================

  const totalUsuarios = usuarios.length;

  const totalClientes = usuarios.filter(
    (usuario) =>
      String(usuario.rol).toUpperCase() === "CLIENTE"
  ).length;

  const totalVendedores = usuarios.filter(
    (usuario) =>
      String(usuario.rol).toUpperCase() === "VENDEDOR"
  ).length;

  const totalAdministradores = usuarios.filter(
    (usuario) =>
      String(usuario.rol).toUpperCase() === "ADMIN"
  ).length;

  // ==========================================
  // COLOR SEGUN EL ROL
  // ==========================================

  const claseRol = (rol) => {

    switch (String(rol).toUpperCase()) {

      case "ADMIN":
        return "badge bg-danger";

      case "VENDEDOR":
        return "badge bg-warning text-dark";

      case "CLIENTE":
        return "badge bg-success";

      default:
        return "badge bg-secondary";
    }

  };

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
  // INTERFAZ
  // ==========================================

  return (

    <div className="container py-4">

      {/* ENCABEZADO */}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

        <div>

          <h1 className="fw-bold text-success mb-2">
            👥 Administración de usuarios
          </h1>

          <p className="text-muted mb-0">
            Usuarios registrados en Spring Boot y MySQL.
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
          Cargando usuarios desde MySQL...
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

          {/* TARJETAS DE RESUMEN */}

          <div className="row g-3 mb-4">

            <div className="col-md-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body text-center">

                  <p className="text-muted mb-1">
                    Total usuarios
                  </p>

                  <h2 className="fw-bold text-success">
                    {totalUsuarios}
                  </h2>

                </div>

              </div>

            </div>

            <div className="col-md-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body text-center">

                  <p className="text-muted mb-1">
                    Clientes
                  </p>

                  <h2 className="fw-bold">
                    {totalClientes}
                  </h2>

                </div>

              </div>

            </div>

            <div className="col-md-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body text-center">

                  <p className="text-muted mb-1">
                    Vendedores
                  </p>

                  <h2 className="fw-bold text-warning">
                    {totalVendedores}
                  </h2>

                </div>

              </div>

            </div>

            <div className="col-md-3">

              <div className="card border-0 shadow-sm h-100">

                <div className="card-body text-center">

                  <p className="text-muted mb-1">
                    Administradores
                  </p>

                  <h2 className="fw-bold text-danger">
                    {totalAdministradores}
                  </h2>

                </div>

              </div>

            </div>

          </div>

          {/* TABLA DE USUARIOS */}

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">

                <h4 className="fw-bold text-success mb-0">
                  📋 Usuarios registrados
                </h4>

                <span className="badge bg-success">
                  {usuariosFiltrados.length} resultados
                </span>

              </div>

              {/* BUSCADOR */}

              <input
                type="text"
                className="form-control mb-4"
                placeholder="🔍 Buscar por nombre, correo, ID o rol..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
              />

              {usuariosFiltrados.length === 0 ? (

                <div className="alert alert-secondary">
                  No hay usuarios para mostrar.
                </div>

              ) : (

                <div className="table-responsive">

                  <table className="table table-hover align-middle">

                    <thead>

                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Correo electrónico</th>
                        <th>Rol</th>
                      </tr>

                    </thead>

                    <tbody>

                      {usuariosFiltrados.map(
                        (usuario) => (

                          <tr key={usuario.id}>

                            <td className="fw-semibold">
                              #{usuario.id}
                            </td>

                            <td>
                              {usuario.nombre}
                            </td>

                            <td>
                              {usuario.correo}
                            </td>

                            <td>

                              <span
                                className={claseRol(usuario.rol)}
                              >
                                {usuario.rol}
                              </span>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

          {/* INFORMACION */}

          <div className="alert alert-info mt-4">

            <strong>Seguridad:</strong> este panel consulta
            los usuarios reales de MySQL mediante JWT.

            <div className="mt-2">

              Las contraseñas no se muestran.
              Por ahora, la administración de usuarios
              es solamente de consulta.

            </div>

          </div>

        </>

      )}

    </div>

  );
}
