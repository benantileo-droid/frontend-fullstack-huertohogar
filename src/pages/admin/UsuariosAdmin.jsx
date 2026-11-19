
import { useEffect, useState } from "react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const ROLES = ["CLIENTE", "VENDEDOR", "ADMIN"];

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

  const [rolesSeleccionados, setRolesSeleccionados] =
    useState({});

  const [cargando, setCargando] = useState(true);

  const [guardandoId, setGuardandoId] = useState(null);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [recarga, setRecarga] = useState(0);

  // ==========================================
  // OBTENER USUARIOS REALES
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
            "La API devolvió un formato incorrecto."
          );
        }

        setUsuarios(respuesta.data);

        // Guardar el rol actual de cada usuario
        // en el selector correspondiente.

        const roles = {};

        respuesta.data.forEach((usuario) => {
          roles[usuario.id] = String(
            usuario.rol
          ).toUpperCase();
        });

        setRolesSeleccionados(roles);

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
  // ACTUALIZAR EL SELECTOR DE ROL
  // ==========================================

  const seleccionarRol = (id, rol) => {

    setRolesSeleccionados((anteriores) => ({
      ...anteriores,
      [id]: rol,
    }));

    setError("");
    setExito("");

  };

  // ==========================================
  // GUARDAR ROL EN MYSQL
  // ==========================================

  const guardarRol = async (usuario) => {

    if (!esAdmin || !token) {
      setError(
        "Debes iniciar sesión como administrador."
      );
      return;
    }

    if (guardandoId !== null) return;

    const nuevoRol = rolesSeleccionados[usuario.id];

    const rolActual = String(
      usuario.rol
    ).toUpperCase();

    if (!ROLES.includes(nuevoRol)) {
      setError("Selecciona un rol válido.");
      return;
    }

    if (nuevoRol === rolActual) {
      return;
    }

    // Evitar modificar el rol de la propia cuenta.
    // El backend también valida esta restricción.

    if (
      String(usuario.id) ===
      String(usuarioActual?.id)
    ) {
      setError(
        "No puedes cambiar el rol de tu propia cuenta."
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Cambiar el rol de "${usuario.nombre}"?\n\n` +
      `Rol actual: ${rolActual}\n` +
      `Rol nuevo: ${nuevoRol}\n\n` +
      "Este cambio se guardará en MySQL."
    );

    if (!confirmar) return;

    setGuardandoId(usuario.id);
    setError("");
    setExito("");

    try {

      // ====================================
      // PUT /api/v1/admin/usuarios/{id}/rol
      // ====================================

      const respuesta = await api.put(
        `/admin/usuarios/${usuario.id}/rol`,
        {
          rol: nuevoRol,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Actualizar la tabla únicamente después
      // de que Spring Boot confirme el cambio.

      setUsuarios((anteriores) =>
        anteriores.map((item) =>
          String(item.id) === String(usuario.id)
            ? respuesta.data
            : item
        )
      );

      setRolesSeleccionados((anteriores) => ({
        ...anteriores,
        [usuario.id]: String(
          respuesta.data.rol
        ).toUpperCase(),
      }));

      setExito(
        `Rol de "${usuario.nombre}" actualizado a ${nuevoRol} correctamente.`
      );

    } catch (err) {

      console.error(
        "Error al cambiar rol:",
        err
      );

      const estado = err.response?.status;

      if (estado === 400) {

        setError(
          "El rol seleccionado no es válido."
        );

      } else if (estado === 401) {

        setError(
          "Tu sesión venció. Inicia sesión nuevamente."
        );

      } else if (estado === 403) {

        setError(
          "No tienes permisos para modificar roles."
        );

      } else if (estado === 404) {

        setError(
          "El usuario ya no existe en MySQL."
        );

      } else if (estado === 409) {

        setError(
          "No se pudo modificar el rol porque existe una restricción de seguridad."
        );

      } else {

        setError(
          "No se pudo actualizar el rol. Revisa la conexión con Spring Boot."
        );

      }

    } finally {

      setGuardandoId(null);

    }

  };

  // ==========================================
  // BUSCADOR
  // ==========================================

  const texto = busqueda.trim().toLowerCase();

  const usuariosFiltrados = usuarios.filter(
    (usuario) => {

      const contenido = [
        usuario.id,
        usuario.nombre,
        usuario.correo,
        usuario.rol,
      ]
        .map((valor) =>
          String(valor ?? "").toLowerCase()
        )
        .join(" ");

      return contenido.includes(texto);
    }
  );

  // ==========================================
  // CONTADORES
  // ==========================================

  const contarRol = (rol) =>
    usuarios.filter(
      (usuario) =>
        String(usuario.rol).toUpperCase() === rol
    ).length;

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
            Usuarios y roles reales desde MySQL.
          </p>

        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          disabled={cargando || guardandoId !== null}
          onClick={() => {
            setExito("");
            setRecarga((anterior) => anterior + 1);
          }}
        >
          🔄 Actualizar
        </button>

      </div>

      {/* MENSAJES */}

      {error && (
        <div className="alert alert-danger" role="alert">
          ❌ {error}
        </div>
      )}

      {exito && (
        <div className="alert alert-success" role="status">
          ✅ {exito}
        </div>
      )}

      {cargando && (
        <div className="alert alert-info">
          Cargando usuarios desde MySQL...
        </div>
      )}

      {!cargando && (

        <>

          {/* CONTADORES */}

          <div className="row g-3 mb-4">

            {[
              {
                titulo: "Total usuarios",
                cantidad: usuarios.length,
                color: "text-success",
              },
              {
                titulo: "Clientes",
                cantidad: contarRol("CLIENTE"),
                color: "text-primary",
              },
              {
                titulo: "Vendedores",
                cantidad: contarRol("VENDEDOR"),
                color: "text-warning",
              },
              {
                titulo: "Administradores",
                cantidad: contarRol("ADMIN"),
                color: "text-danger",
              },
            ].map((tarjeta) => (

              <div
                className="col-md-3"
                key={tarjeta.titulo}
              >

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-body text-center">

                    <p className="text-muted mb-2">
                      {tarjeta.titulo}
                    </p>

                    <h2
                      className={`fw-bold ${tarjeta.color}`}
                    >
                      {tarjeta.cantidad}
                    </h2>

                  </div>

                </div>

              </div>

            ))}

          </div>

          {/* TABLA */}

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4">

              <h4 className="fw-bold text-success mb-3">
                📋 Usuarios registrados
              </h4>

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
                        <th>Correo</th>
                        <th>Rol actual</th>
                        <th>Nuevo rol</th>
                        <th>Acción</th>
                      </tr>

                    </thead>

                    <tbody>

                      {usuariosFiltrados.map((usuario) => {

                        const esMiCuenta =
                          String(usuario.id) ===
                          String(usuarioActual?.id);

                        const rolActual = String(
                          usuario.rol
                        ).toUpperCase();

                        const rolSeleccionado =
                          rolesSeleccionados[usuario.id] ??
                          rolActual;

                        const tieneCambios =
                          rolSeleccionado !== rolActual;

                        return (

                          <tr key={usuario.id}>

                            <td className="fw-semibold">
                              #{usuario.id}
                            </td>

                            <td>
                              {usuario.nombre}

                              {esMiCuenta && (
                                <span className="badge bg-secondary ms-2">
                                  Tú
                                </span>
                              )}
                            </td>

                            <td>
                              {usuario.correo}
                            </td>

                            <td>

                              <span
                                className={
                                  rolActual === "ADMIN"
                                    ? "badge bg-danger"
                                    : rolActual === "VENDEDOR"
                                      ? "badge bg-warning text-dark"
                                      : "badge bg-success"
                                }
                              >
                                {rolActual}
                              </span>

                            </td>

                            <td>

                              <select
                                className="form-select form-select-sm"
                                value={rolSeleccionado}
                                disabled={
                                  esMiCuenta ||
                                  guardandoId !== null
                                }
                                onChange={(e) =>
                                  seleccionarRol(
                                    usuario.id,
                                    e.target.value
                                  )
                                }
                              >

                                {ROLES.map((rol) => (
                                  <option
                                    key={rol}
                                    value={rol}
                                  >
                                    {rol}
                                  </option>
                                ))}

                              </select>

                            </td>

                            <td>

                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                disabled={
                                  esMiCuenta ||
                                  !tieneCambios ||
                                  guardandoId !== null
                                }
                                onClick={() =>
                                  guardarRol(usuario)
                                }
                              >
                                {guardandoId === usuario.id
                                  ? "Guardando..."
                                  : "Guardar rol"}
                              </button>

                            </td>

                          </tr>

                        );

                      })}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

          {/* INFORMACION DE SEGURIDAD */}

          <div className="alert alert-info mt-4">

            <strong>Seguridad:</strong> solamente ADMIN
            puede cambiar roles.

            <div className="mt-2">
              No puedes modificar tu propio rol y
              todos los cambios se guardan en MySQL.
            </div>

            <div className="mt-2">
              El usuario modificado debe cerrar sesión
              y volver a iniciar para obtener un JWT
              con su nuevo rol.
            </div>

          </div>

        </>

      )}

    </div>

  );

}
