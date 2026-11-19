
import { useEffect, useRef, useState } from "react";

import {
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

// ==========================================
// HOOKS Y CONTEXTOS
// ==========================================

import useProductosApi from "./hooks/useProductosApi";
import useCategoriasApi from "./hooks/useCategoriasApi";

import { useAuth } from "./context/AuthContext";
import { useCarrito } from "./context/CarritoContext";

import api from "./services/api";

// ==========================================
// DATOS ANTIGUOS PENDIENTES DE MIGRAR
// SOLO EL DETALLE DE ORDENES
// ==========================================

import { getOrdenes } from "./data/db";

// ==========================================
// PAGINAS DE LA TIENDA
// ==========================================

import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Categoria from "./pages/Categoria";
import Ofertas from "./pages/Ofertas";
import Carrito from "./pages/Carrito";
import Checkout from "./pages/Checkout";
import CompraExitosa from "./pages/CompraExitosa";
import CompraFallida from "./pages/CompraFallida";
import ProductDetail from "./components/ProductDetail";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Nosotros from "./pages/Nosotros";
import Contacto from "./pages/Contacto";
import Blog from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import MisCompras from "./pages/MisCompras";

// ==========================================
// PANEL ADMINISTRATIVO
// ==========================================

import RutaAdmin from "./components/RutaAdmin";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import Dashboard from "./pages/admin/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import Ordenes from "./pages/admin/Ordenes";
import BoletaAdmin from "./pages/admin/BoletaAdmin";
import AdminProductos from "./pages/admin/AdminProductos";
import AdminProductoForm from "./pages/admin/AdminProductoForm";
import ProductosCriticos from "./pages/admin/ProductosCriticos";
import AdminCategorias from "./pages/admin/AdminCategorias";

export default function App() {

  // ==========================================
  // PRODUCTOS DESDE MYSQL
  // ==========================================

  const {
    productos,
    setProductos,
    cargando,
    error,
  } = useProductosApi();

  // ==========================================
  // CATEGORIAS DESDE MYSQL
  // ==========================================

  const {
    categorias,
    cargandoCategorias,
    errorCategorias,
  } = useCategoriasApi();

  // ==========================================
  // AUTENTICACION JWT
  // ==========================================

  const {
    usuarioActual,
    token,
    cerrarSesion,
  } = useAuth();

  // ==========================================
  // CARRITO GLOBAL
  // ==========================================

  const {
    carrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    aumentarCantidad,
    disminuirCantidad,
    vaciarCarrito,
  } = useCarrito();

  // ==========================================
  // ESTADOS DE LA TIENDA
  // ==========================================

  const [busqueda, setBusqueda] = useState("");

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] = useState("Todas");

  const [modoAdmin, setModoAdmin] = useState(false);

  const eliminandoProductoRef = useRef(false);

  // ==========================================
  // DETALLE ANTIGUO DE ORDENES
  // PENDIENTE DE MIGRAR
  // ==========================================

  const [ordenes] = useState(getOrdenes);

  // ==========================================
  // NAVEGACION
  // ==========================================

  const navigate = useNavigate();
  const location = useLocation();

  const esRutaAdmin =
    location.pathname.startsWith("/admin");

  const esAdmin =
    usuarioActual?.rol === "admin";

  // ==========================================
  // SINCRONIZAR CATEGORIAS
  // ==========================================

  useEffect(() => {

    if (cargandoCategorias || errorCategorias) {
      return;
    }

    if (categoriaSeleccionada === "Todas") {
      return;
    }

    const existe = categorias.some(
      (categoria) =>
        categoria.nombre === categoriaSeleccionada
    );

    if (!existe) {
      setCategoriaSeleccionada("Todas");
    }

  }, [
    categorias,
    categoriaSeleccionada,
    cargandoCategorias,
    errorCategorias,
  ]);

  // ==========================================
  // CERRAR SESION
  // ==========================================

  const handleLogout = () => {

    cerrarSesion();

    vaciarCarrito();

    setModoAdmin(false);

    navigate("/");
  };

  // ==========================================
  // PRODUCTOS - NUEVO
  // ==========================================

  const handleNewProduct = () => {

    if (!esAdmin) return;

    navigate("/admin/productos/nuevo");
  };

  // ==========================================
  // PRODUCTOS - EDITAR
  // ==========================================

  const handleEditProduct = (producto) => {

    if (!esAdmin) return;

    const id =
      typeof producto === "object"
        ? producto?.id
        : producto;

    if (id == null) return;

    navigate(`/admin/productos/${id}/editar`);
  };

  // ==========================================
  // PRODUCTOS - ELIMINAR DESDE MYSQL
  // ==========================================

  const handleDeleteProduct = async (productoOId) => {

    if (!esAdmin || !token) {

      window.alert(
        "Debes iniciar sesión como administrador."
      );

      return;
    }

    if (eliminandoProductoRef.current) return;

    const id =
      typeof productoOId === "object"
        ? productoOId?.id
        : productoOId;

    if (id == null) return;

    const producto = productos.find(
      (item) =>
        String(item.id) === String(id)
    );

    const nombre =
      producto?.nombre ?? `#${id}`;

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${nombre}"?\n\n` +
      "El producto se eliminará de MySQL."
    );

    if (!confirmar) return;

    eliminandoProductoRef.current = true;

    try {

      await api.delete(
        `/productos/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProductos((actuales) =>
        actuales.filter(
          (item) =>
            String(item.id) !== String(id)
        )
      );

      window.alert(
        "Producto eliminado correctamente de MySQL."
      );

    } catch (err) {

      console.error(
        "Error al eliminar producto:",
        err
      );

      const estado = err.response?.status;

      if (estado === 401) {

        window.alert(
          "Tu sesión venció. Inicia sesión nuevamente."
        );

      } else if (estado === 403) {

        window.alert(
          "No tienes permisos para eliminar productos."
        );

      } else if (estado === 404) {

        window.alert(
          "El producto ya no existe en MySQL."
        );

      } else if (estado === 409) {

        window.alert(
          "No se puede eliminar el producto porque tiene datos asociados."
        );

      } else {

        window.alert(
          "No se pudo eliminar el producto. Revisa Spring Boot."
        );

      }

    } finally {

      eliminandoProductoRef.current = false;

    }
  };

  // ==========================================
  // FILTROS DE PRODUCTOS
  // ==========================================

  const productosFiltrados = productos.filter(
    (producto) => {

      const nombre = String(
        producto.nombre ?? ""
      ).toLowerCase();

      const coincideNombre = nombre.includes(
        busqueda.toLowerCase()
      );

      const coincideCategoria =
        categoriaSeleccionada === "Todas" ||
        producto.categoria === categoriaSeleccionada;

      return coincideNombre && coincideCategoria;
    }
  );

  // ==========================================
  // MENSAJES DE CATEGORIAS
  // ==========================================

  const mensajeCategorias = cargandoCategorias ? (

    <div className="container py-5">

      <div className="alert alert-info">
        Cargando categorías desde MySQL...
      </div>

    </div>

  ) : errorCategorias ? (

    <div className="container py-5">

      <div className="alert alert-danger">
        {errorCategorias}
      </div>

    </div>

  ) : null;

  // ==========================================
  // INTERFAZ PRINCIPAL
  // ==========================================

  return (

    <div className="bg-light min-vh-100 d-flex flex-column">

      {/* ==================================== */}
      {/* BARRA DE NAVEGACION */}
      {/* ==================================== */}

      {!esRutaAdmin && (

        <nav className="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm d-print-none">

          <div className="container-fluid px-4">

            <Link
              className="navbar-brand fw-bold fs-4 me-4"
              to="/"
            >
              🌱 Huerto Hogar
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Abrir menú"
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div
              className="collapse navbar-collapse"
              id="navbarNav"
            >

              <div className="navbar-nav me-auto align-items-lg-center">

                <Link className="nav-link" to="/">
                  Inicio
                </Link>

                <Link className="nav-link" to="/productos">
                  Productos
                </Link>

                <Link className="nav-link" to="/categorias">
                  Categorías
                </Link>

                <Link className="nav-link" to="/ofertas">
                  Ofertas
                </Link>

                <Link className="nav-link" to="/blog">
                  Blog
                </Link>

                <Link className="nav-link" to="/nosotros">
                  Nosotros
                </Link>

                <Link className="nav-link" to="/contacto">
                  Contacto
                </Link>

                {/* USUARIO SIN SESION */}

                {!usuarioActual ? (

                  <>

                    <Link
                      className="nav-link"
                      to="/registro"
                    >
                      Registro
                    </Link>

                    <Link
                      className="nav-link"
                      to="/login"
                    >
                      Iniciar Sesión
                    </Link>

                  </>

                ) : (

                  <>

                    {/* USUARIO AUTENTICADO */}

                    <span className="nav-link text-white-50">
                      👤 {usuarioActual.nombre}
                    </span>

                    <button
                      type="button"
                      className="btn btn-link nav-link"
                      onClick={handleLogout}
                    >
                      Cerrar sesión
                    </button>

                    {/* HISTORIAL DE COMPRAS */}

                    {(
                      usuarioActual.rol === "cliente" ||
                      usuarioActual.rol === "admin"
                    ) && (

                      <Link
                        className="nav-link"
                        to="/mis-compras"
                      >
                        📦 Mis Compras
                      </Link>

                    )}

                  </>

                )}

                {/* PANEL VENDEDOR */}

                {usuarioActual?.rol === "vendedor" && (

                  <Link
                    className="nav-link"
                    to="/vendedor/ordenes"
                  >
                    🧾 Panel Vendedor
                  </Link>

                )}

                {/* CARRITO */}

                <Link className="nav-link" to="/carrito">
                  🛒 ({carrito.length})
                </Link>

              </div>

              {/* BUSCADOR Y ADMINISTRACION */}

              <div className="d-flex flex-column flex-xl-row gap-2 my-2 my-lg-0">

                <input
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="🔍 Buscar..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                />

                {esAdmin && (

                  <>

                    <Link
                      to="/admin"
                      className="btn btn-outline-light rounded-pill text-nowrap"
                    >
                      📊 Dashboard
                    </Link>

                    <button
                      type="button"
                      className="btn btn-outline-light rounded-pill text-nowrap"
                      onClick={() =>
                        setModoAdmin((anterior) => !anterior)
                      }
                    >
                      {modoAdmin
                        ? "Salir Admin"
                        : "⚙️ Admin"}
                    </button>

                    <Link
                      to="/admin/usuarios"
                      className="btn btn-outline-light rounded-pill text-nowrap"
                    >
                      👥 Usuarios
                    </Link>

                  </>

                )}

              </div>

            </div>
          </div>

        </nav>

      )}

      {/* ==================================== */}
      {/* RUTAS DE LA APLICACION */}
      {/* ==================================== */}

      <Routes>

        {/* INICIO */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* PRODUCTOS */}

        <Route
          path="/productos"
          element={

            <>

              {errorCategorias && (

                <div className="container mt-3">
                  <div className="alert alert-warning mb-0">
                    {errorCategorias}
                  </div>
                </div>

              )}

              <Productos
                productos={productos}
                categorias={categorias}
                productosFiltrados={productosFiltrados}
                cargandoProductos={cargando}
                errorProductos={error}
                recargarProductos={() =>
                  window.location.reload()
                }
                categoriaSeleccionada={categoriaSeleccionada}
                setCategoriaSeleccionada={setCategoriaSeleccionada}
                onAddToCart={agregarAlCarrito}
                onDelete={handleDeleteProduct}
                onEdit={handleEditProduct}
                modoAdmin={modoAdmin && esAdmin}
                onNewProduct={handleNewProduct}
              />

            </>

          }
        />

        {/* CATEGORIAS */}

        <Route
          path="/categorias"
          element={

            mensajeCategorias ?? (

              <Categoria
                categorias={categorias}
                productos={productos}
                onAddToCart={agregarAlCarrito}
              />

            )

          }
        />

        <Route
          path="/categorias/:nombre"
          element={

            mensajeCategorias ?? (

              <Categoria
                categorias={categorias}
                productos={productos}
                onAddToCart={agregarAlCarrito}
              />

            )

          }
        />

        {/* OFERTAS */}

        <Route
          path="/ofertas"
          element={

            <Ofertas
              productos={productos}
              onAddToCart={agregarAlCarrito}
            />

          }
        />

        {/* CARRITO */}

        <Route
          path="/carrito"
          element={

            <Carrito
              carrito={carrito}
              onRemove={eliminarDelCarrito}
              onIncrease={aumentarCantidad}
              onDecrease={disminuirCantidad}
            />

          }
        />

        {/* CHECKOUT */}

        <Route
          path="/checkout"
          element={

            <Checkout
              carrito={carrito}
              productos={productos}
              onClearCart={vaciarCarrito}
              usuarioActual={usuarioActual}
            />

          }
        />

        {/* RESULTADOS DE COMPRA */}

        <Route
          path="/compra-exitosa"
          element={<CompraExitosa />}
        />

        <Route
          path="/compra-fallida"
          element={<CompraFallida />}
        />

        {/* DETALLE DE PRODUCTO */}

        <Route
          path="/productos/:id"
          element={

            <ProductDetail
              productos={productos}
              onAddToCart={agregarAlCarrito}
            />

          }
        />

        {/* AUTENTICACION */}

        <Route
          path="/registro"
          element={<Registro />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* MIS COMPRAS */}

        <Route
          path="/mis-compras"
          element={<MisCompras />}
        />

        {/* INFORMACION */}

        <Route
          path="/nosotros"
          element={<Nosotros />}
        />

        <Route
          path="/contacto"
          element={<Contacto />}
        />

        {/* BLOG */}

        <Route
          path="/blog"
          element={<Blog />}
        />

        <Route
          path="/blog/:id"
          element={<BlogDetail />}
        />

        {/* ================================= */}
        {/* PANEL VENDEDOR */}
        {/* ================================= */}

        <Route
          path="/vendedor/ordenes"
          element={

            usuarioActual?.rol === "vendedor" ? (

              <Ordenes />

            ) : (

              <div className="container py-5">

                <div className="alert alert-danger">
                  Acceso exclusivo para vendedores.
                </div>

              </div>

            )

          }
        />

        {/* ================================= */}
        {/* PANEL ADMINISTRADOR */}
        {/* ================================= */}

        <Route
          path="/admin"
          element={

            <RutaAdmin usuarioActual={usuarioActual}>

              <AdminLayout
                usuarioActual={usuarioActual}
                onLogout={handleLogout}
              />

            </RutaAdmin>

          }
        >

          {/* DASHBOARD REAL */}

          <Route
            index
            element={<Dashboard />}
          />

          {/* ORDENES REALES */}

          <Route
            path="ordenes"
            element={<Ordenes />}
          />

          {/* DETALLE DE ORDEN ANTIGUO */}
          {/* LO MIGRAREMOS EN OTRA ETAPA */}

          <Route
            path="ordenes/:numero"
            element={
              <BoletaAdmin ordenes={ordenes} />
            }
          />

          {/* ================================= */}
          {/* USUARIOS - MYSQL */}
          {/* ================================= */}

          <Route
            path="usuarios"
            element={<UsuariosAdmin />}
          />

          {/* RUTAS ANTIGUAS DE USUARIOS */}
          {/* REDIRIGEN AL PANEL REAL */}

          <Route
            path="usuarios/nuevo"
            element={
              <Navigate
                to="/admin/usuarios"
                replace
              />
            }
          />

          <Route
            path="usuarios/:id/editar"
            element={
              <Navigate
                to="/admin/usuarios"
                replace
              />
            }
          />

          {/* ================================= */}
          {/* PRODUCTOS - MYSQL */}
          {/* ================================= */}

          <Route
            path="productos"
            element={
              <AdminProductos productos={productos} />
            }
          />

          <Route
            path="productos/nuevo"
            element={

              mensajeCategorias ?? (

                <AdminProductoForm
                  categorias={categorias}
                />

              )

            }
          />

          <Route
            path="productos/:id/editar"
            element={

              mensajeCategorias ?? (

                <AdminProductoForm
                  categorias={categorias}
                />

              )

            }
          />

          {/* PRODUCTOS CRITICOS */}

          <Route
            path="productos-criticos"
            element={

              <ProductosCriticos
                productos={productos}
              />

            }
          />

          {/* CATEGORIAS - MYSQL */}

          <Route
            path="categorias"
            element={<AdminCategorias />}
          />

        </Route>

      </Routes>

      {/* ==================================== */}
      {/* FOOTER */}
      {/* ==================================== */}

      <footer className="bg-dark text-white py-4 mt-5 d-print-none">

        <div className="container text-center">

          <p className="m-0 fw-light">
            🌱 <strong>Huerto Hogar</strong> -
            Evaluación FullStack DSY1104 | Duoc UC
          </p>

          <small className="text-secondary">
            Desarrollado con React, Bootstrap,
            Jasmine y Karma
          </small>

        </div>

      </footer>

    </div>
  );
}
