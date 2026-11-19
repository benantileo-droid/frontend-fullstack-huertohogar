
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import ProductForm from "./ProductForm";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminProductoForm({
  categorias = [],
}) {

  // ==========================================
  // NAVEGACION Y AUTENTICACION
  // ==========================================

  const { id } = useParams();
  const navigate = useNavigate();

  const { usuarioActual, token } = useAuth();

  const esEdicion = Boolean(id);

  // ==========================================
  // ESTADOS
  // ==========================================

  const [productoEditando, setProductoEditando] =
    useState(null);

  const [cargandoProducto, setCargandoProducto] =
    useState(esEdicion);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [errorCarga, setErrorCarga] =
    useState("");

  const guardandoRef = useRef(false);

  // ==========================================
  // CARGAR PRODUCTO AL EDITAR
  // ==========================================

  useEffect(() => {

    if (!id) {
      setProductoEditando(null);
      setCargandoProducto(false);
      setErrorCarga("");
      return;
    }

    const controller = new AbortController();

    const cargarProducto = async () => {

      setCargandoProducto(true);
      setErrorCarga("");
      setProductoEditando(null);

      try {

        const respuesta = await api.get(
          `/productos/${id}`,
          {
            signal: controller.signal,
          }
        );

        if (!controller.signal.aborted) {
          setProductoEditando(respuesta.data);
        }

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error(
          "Error al cargar producto:",
          err
        );

        if (err.response?.status === 404) {

          setErrorCarga(
            "El producto que intentas editar no existe."
          );

        } else {

          setErrorCarga(
            "No se pudo cargar el producto desde MySQL."
          );

        }

      } finally {

        if (!controller.signal.aborted) {
          setCargandoProducto(false);
        }

      }

    };

    cargarProducto();

    return () => controller.abort();

  }, [id]);

  // ==========================================
  // CREAR O ACTUALIZAR PRODUCTO
  // ==========================================

  const guardarProducto = async (datos) => {

    if (guardandoRef.current) return;

    if (usuarioActual?.rol !== "admin" || !token) {
      setError(
        "Debes iniciar sesión como administrador."
      );
      return;
    }

    // Convertimos los campos del formulario
    // al formato esperado por ProductoDTO.

    const productoDTO = {

      nombre: String(datos.nombre ?? "").trim(),

      precio: Number(datos.precio),

      categoria: String(
        datos.categoria ?? ""
      ).trim(),

      descripcion: String(
        datos.descripcion ?? ""
      ).trim(),

      imagen: String(
        datos.imagen ?? ""
      ).trim(),

      oferta: Boolean(datos.oferta),

      descuento: datos.oferta
        ? Number(datos.descuento)
        : 0,

      stock: Number(datos.stock),

    };

    // ========================================
    // VALIDACIONES
    // ========================================

    if (
      !productoDTO.nombre ||
      !productoDTO.categoria ||
      !productoDTO.descripcion ||
      !productoDTO.imagen
    ) {

      setError(
        "Completa todos los campos obligatorios."
      );
      return;

    }

    if (
      !Number.isFinite(productoDTO.precio) ||
      productoDTO.precio < 0
    ) {

      setError(
        "El precio debe ser un número válido."
      );
      return;

    }

    if (
      !Number.isInteger(productoDTO.stock) ||
      productoDTO.stock < 0
    ) {

      setError(
        "El stock debe ser un número entero igual o mayor que cero."
      );
      return;

    }

    if (
      !Number.isInteger(productoDTO.descuento) ||
      productoDTO.descuento < 0 ||
      productoDTO.descuento > 90
    ) {

      setError(
        "El descuento debe estar entre 0 y 90%."
      );
      return;

    }

    // ========================================
    // SOLICITUD A SPRING BOOT
    // ========================================

    guardandoRef.current = true;

    setGuardando(true);
    setError("");

    try {

      const configuracion = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (esEdicion) {

        // PUT /api/v1/productos/{id}

        await api.put(
          `/productos/${id}`,
          productoDTO,
          configuracion
        );

        window.alert(
          "Producto actualizado correctamente en MySQL."
        );

      } else {

        // POST /api/v1/productos

        await api.post(
          "/productos",
          productoDTO,
          configuracion
        );

        window.alert(
          "Producto creado correctamente en MySQL."
        );

      }

      // Al cambiar de ruta, useProductosApi
      // volverá a consultar los productos.

      navigate("/admin/productos");

    } catch (err) {

      console.error(
        "Error al guardar producto:",
        err
      );

      const estado = err.response?.status;

      if (estado === 400) {

        setError(
          "La API rechazó los datos. Revisa los campos del producto."
        );

      } else if (estado === 401) {

        setError(
          "Tu sesión venció. Inicia sesión nuevamente."
        );

      } else if (estado === 403) {

        setError(
          "No tienes permisos para crear o editar productos."
        );

      } else if (estado === 404) {

        setError(
          "El producto no existe en MySQL."
        );

      } else if (estado === 409) {

        setError(
          "Existe un conflicto con los datos del producto."
        );

      } else {

        setError(
          "No se pudo guardar el producto. Comprueba que Spring Boot esté funcionando."
        );

      }

    } finally {

      guardandoRef.current = false;
      setGuardando(false);

    }

  };

  // ==========================================
  // CONTROL DE ACCESO
  // ==========================================

  if (usuarioActual?.rol !== "admin") {

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

      <div className="row justify-content-center">

        <div className="col-lg-8">

          <Link
            to="/admin/productos"
            className="btn btn-outline-secondary btn-sm mb-3"
          >
            ← Volver a productos
          </Link>

          <div className="mb-4">

            <h2 className="fw-bold text-success">

              {esEdicion
                ? "✏️ Editar producto"
                : "➕ Crear producto"}

            </h2>

            <p className="text-muted">

              {esEdicion
                ? "Modifica los datos del producto guardado en MySQL."
                : "Registra un nuevo producto en MySQL."}

            </p>

          </div>

          {/* CARGANDO */}

          {cargandoProducto && (

            <div className="alert alert-info">
              Cargando producto desde MySQL...
            </div>

          )}

          {/* ERROR DE CARGA */}

          {errorCarga && (

            <div className="alert alert-danger">
              {errorCarga}
            </div>

          )}

          {/* ERROR AL GUARDAR */}

          {error && (

            <div className="alert alert-danger">
              {error}
            </div>

          )}

          {/* GUARDANDO */}

          {guardando && (

            <div className="alert alert-info">
              Guardando producto en MySQL...
            </div>

          )}

          {/* FORMULARIO EXISTENTE */}

          {!cargandoProducto &&
            !errorCarga &&
            (!esEdicion || productoEditando) && (

              <fieldset disabled={guardando}>

                <ProductForm
                  key={esEdicion ? id : "nuevo"}
                  onSave={guardarProducto}
                  productoEditando={productoEditando}
                  categorias={categorias}
                />

              </fieldset>

            )}

        </div>

      </div>

    </div>

  );

}
