
import { useEffect, useState } from "react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const formularioInicial = {
  nombre: "",
  descripcion: "",
};

export default function AdminCategorias() {

  // ==========================================
  // AUTENTICACION
  // ==========================================

  const { usuarioActual, token } = useAuth();

  const esAdmin = usuarioActual?.rol === "admin";

  // ==========================================
  // ESTADOS
  // ==========================================

  const [categorias, setCategorias] = useState([]);

  const [formulario, setFormulario] = useState(
    formularioInicial
  );

  const [categoriaEditando, setCategoriaEditando] =
    useState(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [recarga, setRecarga] = useState(0);

  // ==========================================
  // CARGAR CATEGORIAS DESDE MYSQL
  // ==========================================

  useEffect(() => {

    if (!esAdmin) {
      setCargando(false);
      return;
    }

    const controller = new AbortController();

    const cargarCategorias = async () => {

      setCargando(true);
      setError("");

      try {

        const respuesta = await api.get(
          "/categorias",
          {
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (!Array.isArray(respuesta.data)) {
          throw new Error(
            "Formato de categorías incorrecto."
          );
        }

        setCategorias(respuesta.data);

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error(
          "Error cargando categorías:",
          err
        );

        setError(
          "No se pudieron cargar las categorías desde MySQL."
        );

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false);
        }

      }
    };

    cargarCategorias();

    return () => controller.abort();

  }, [esAdmin, recarga]);

  // ==========================================
  // CAMBIAR CAMPOS DEL FORMULARIO
  // ==========================================

  const cambiarCampo = (evento) => {

    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

  };

  // ==========================================
  // CANCELAR EDICION
  // ==========================================

  const cancelarEdicion = () => {

    setCategoriaEditando(null);
    setFormulario({ ...formularioInicial });

    setError("");
    setExito("");

  };

  // ==========================================
  // PREPARAR EDICION
  // ==========================================

  const editarCategoria = (categoria) => {

    setCategoriaEditando(categoria.id);

    setFormulario({
      nombre: categoria.nombre ?? "",
      descripcion: categoria.descripcion ?? "",
    });

    setError("");
    setExito("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };

  // ==========================================
  // CREAR O ACTUALIZAR CATEGORIA
  // ==========================================

  const guardarCategoria = async (evento) => {

    evento.preventDefault();

    if (guardando || eliminandoId !== null) return;

    if (!esAdmin || !token) {

      setError(
        "Debes iniciar sesión como administrador."
      );

      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
    };

    if (!datos.nombre) {

      setError(
        "El nombre de la categoría es obligatorio."
      );

      return;
    }

    setGuardando(true);
    setError("");
    setExito("");

    try {

      const configuracion = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (categoriaEditando !== null) {

        // ====================================
        // ACTUALIZAR CATEGORIA
        // PUT /api/v1/categorias/{id}
        // ====================================

        const respuesta = await api.put(
          `/categorias/${categoriaEditando}`,
          datos,
          configuracion
        );

        setCategorias((anteriores) =>
          anteriores.map((categoria) =>
            String(categoria.id) ===
            String(categoriaEditando)
              ? respuesta.data
              : categoria
          )
        );

        setExito(
          "Categoría actualizada correctamente en MySQL."
        );

      } else {

        // ====================================
        // CREAR CATEGORIA
        // POST /api/v1/categorias
        // ====================================

        const respuesta = await api.post(
          "/categorias",
          datos,
          configuracion
        );

        setCategorias((anteriores) => [
          ...anteriores,
          respuesta.data,
        ]);

        setExito(
          "Categoría creada correctamente en MySQL."
        );

      }

      setFormulario({ ...formularioInicial });
      setCategoriaEditando(null);

    } catch (err) {

      console.error(
        "Error al guardar categoría:",
        err
      );

      const estado = err.response?.status;

      if (estado === 400) {

        setError(
          "Los datos no son válidos. Revisa el nombre y la descripción."
        );

      } else if (estado === 401) {

        setError(
          "Tu sesión venció. Inicia sesión nuevamente."
        );

      } else if (estado === 403) {

        setError(
          "No tienes permisos para modificar categorías."
        );

      } else if (estado === 404) {

        setError(
          "La categoría ya no existe en MySQL."
        );

      } else if (estado === 409) {

        setError(
          "Ya existe una categoría con ese nombre."
        );

      } else {

        setError(
          "No se pudo guardar la categoría. Comprueba que Spring Boot esté funcionando."
        );

      }

    } finally {

      setGuardando(false);

    }

  };

  // ==========================================
  // ELIMINAR CATEGORIA
  // ==========================================

  const eliminarCategoria = async (categoria) => {

    if (guardando || eliminandoId !== null) return;

    if (!esAdmin || !token) {

      setError(
        "Debes iniciar sesión como administrador."
      );

      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${categoria.nombre}"?\n\n` +
      "No podrás recuperar esta categoría después."
    );

    if (!confirmar) return;

    setEliminandoId(categoria.id);
    setError("");
    setExito("");

    try {

      // ====================================
      // DELETE /api/v1/categorias/{id}
      // ====================================

      await api.delete(
        `/categorias/${categoria.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCategorias((anteriores) =>
        anteriores.filter(
          (item) =>
            String(item.id) !== String(categoria.id)
        )
      );

      if (
        String(categoriaEditando) ===
        String(categoria.id)
      ) {
        setCategoriaEditando(null);
        setFormulario({ ...formularioInicial });
      }

      setExito(
        `La categoría "${categoria.nombre}" fue eliminada de MySQL.`
      );

    } catch (err) {

      console.error(
        "Error al eliminar categoría:",
        err
      );

      const estado = err.response?.status;

      if (estado === 409) {

        setError(
          "No puedes eliminar esta categoría porque tiene productos asociados."
        );

      } else if (estado === 404) {

        setError(
          "La categoría ya no existe en MySQL."
        );

      } else if (estado === 401) {

        setError(
          "Tu sesión venció. Inicia sesión nuevamente."
        );

      } else if (estado === 403) {

        setError(
          "No tienes permisos para eliminar categorías."
        );

      } else {

        setError(
          "No se pudo eliminar la categoría."
        );

      }

    } finally {

      setEliminandoId(null);

    }

  };

  // ==========================================
  // FILTRAR CATEGORIAS
  // ==========================================

  const texto = busqueda.trim().toLowerCase();

  const categoriasFiltradas = categorias.filter(
    (categoria) =>

      String(categoria.nombre ?? "")
        .toLowerCase()
        .includes(texto) ||

      String(categoria.descripcion ?? "")
        .toLowerCase()
        .includes(texto)

  );

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

      {/* TITULO */}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

        <div>

          <h1 className="fw-bold text-success mb-2">
            🏷️ Administración de categorías
          </h1>

          <p className="text-muted mb-0">
            Gestiona las categorías guardadas en MySQL.
          </p>

        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          disabled={cargando}
          onClick={() => {
            setExito("");
            setRecarga((n) => n + 1);
          }}
        >
          🔄 Actualizar
        </button>

      </div>

      {/* MENSAJES */}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {exito && (
        <div className="alert alert-success" role="status">
          ✅ {exito}
        </div>
      )}

      {/* FORMULARIO */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">

          <h4 className="fw-bold text-success mb-3">

            {categoriaEditando !== null
              ? "✏️ Editar categoría"
              : "➕ Crear categoría"}

          </h4>

          <form onSubmit={guardarCategoria}>

            <fieldset
              disabled={
                guardando ||
                eliminandoId !== null
              }
            >

              {/* NOMBRE */}

              <div className="mb-3">

                <label
                  htmlFor="categoria-nombre"
                  className="form-label fw-semibold"
                >
                  Nombre de la categoría
                </label>

                <input
                  id="categoria-nombre"
                  type="text"
                  name="nombre"
                  className="form-control"
                  placeholder="Ej: Frutos Secos"
                  value={formulario.nombre}
                  onChange={cambiarCampo}
                  maxLength={100}
                  required
                />

              </div>

              {/* DESCRIPCION */}

              <div className="mb-3">

                <label
                  htmlFor="categoria-descripcion"
                  className="form-label fw-semibold"
                >
                  Descripción
                </label>

                <textarea
                  id="categoria-descripcion"
                  name="descripcion"
                  className="form-control"
                  rows="3"
                  placeholder="Describe los productos de esta categoría"
                  value={formulario.descripcion}
                  onChange={cambiarCampo}
                />

              </div>

              {/* BOTONES */}

              <div className="d-flex flex-wrap gap-2">

                <button
                  type="submit"
                  className="btn btn-success"
                >

                  {guardando
                    ? "Guardando..."
                    : categoriaEditando !== null
                      ? "Guardar cambios"
                      : "Crear categoría"}

                </button>

                {categoriaEditando !== null && (

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={cancelarEdicion}
                  >
                    Cancelar edición
                  </button>

                )}

              </div>

            </fieldset>

          </form>

        </div>

      </div>

      {/* LISTADO */}

      <div className="card border-0 shadow-sm">

        <div className="card-body p-4">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">

            <h4 className="fw-bold text-success mb-0">
              📋 Categorías registradas
            </h4>

            <span className="badge bg-success">
              {categorias.length} categorías
            </span>

          </div>

          {/* BUSCADOR */}

          <input
            type="text"
            className="form-control mb-3"
            placeholder="🔍 Buscar categoría..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

          {/* CARGANDO */}

          {cargando && (

            <div className="alert alert-info">
              Cargando categorías desde MySQL...
            </div>

          )}

          {/* TABLA */}

          {!cargando && (

            categoriasFiltradas.length === 0 ? (

              <div className="alert alert-secondary">
                No hay categorías para mostrar.
              </div>

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead>

                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th className="text-end">
                        Acciones
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {categoriasFiltradas.map(
                      (categoria) => (

                        <tr key={categoria.id}>

                          <td>
                            #{categoria.id}
                          </td>

                          <td className="fw-semibold">
                            {categoria.nombre}
                          </td>

                          <td>
                            {categoria.descripcion ||
                              "Sin descripción"}
                          </td>

                          <td className="text-end">

                            <button
                              type="button"
                              className="btn btn-outline-warning btn-sm me-2"
                              disabled={
                                guardando ||
                                eliminandoId !== null
                              }
                              onClick={() =>
                                editarCategoria(categoria)
                              }
                            >
                              ✏️ Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              disabled={
                                guardando ||
                                eliminandoId !== null
                              }
                              onClick={() =>
                                eliminarCategoria(categoria)
                              }
                            >
                              {eliminandoId === categoria.id
                                ? "Eliminando..."
                                : "🗑️ Eliminar"}
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )

          )}

        </div>

      </div>

    </div>

  );

}
