
import { useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

// ==========================================
// HOOKS Y CONTEXTOS
// ==========================================

import useProductosApi from "./hooks/useProductosApi";
import { useAuth } from "./context/AuthContext";
import { useCarrito } from "./context/CarritoContext";

// ==========================================
// BASE DE DATOS LOCAL
// PENDIENTE MIGRAR AL BACKEND
// ==========================================

import {
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  agregarCompra,
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  getOrdenes,
  crearOrden,
  descontarStock,
  renombrarCategoriaProductos,
} from "./data/db";

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
// PAGINAS ADMINISTRATIVAS
// ==========================================

import RutaAdmin from "./components/RutaAdmin";
import ProductForm from "./pages/admin/ProductForm";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import Dashboard from "./pages/admin/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import Ordenes from "./pages/admin/Ordenes";
import BoletaAdmin from "./pages/admin/BoletaAdmin";
import AdminProductos from "./pages/admin/AdminProductos";
import AdminProductoForm from "./pages/admin/AdminProductoForm";
import ProductosCriticos from "./pages/admin/ProductosCriticos";
import AdminCategorias from "./pages/admin/AdminCategorias";
import AdminUsuarioForm from "./pages/admin/AdminUsuarioForm";

export default function App() {

  // ==========================================
  // PRODUCTOS DESDE SPRING BOOT / MYSQL
  // ==========================================

  const {
    productos,
    setProductos,
    cargando,
    error,
  } = useProductosApi();

  // ==========================================
  // AUTENTICACION CON JWT
  // ==========================================

  const {
    usuarioActual,
    cerrarSesion,
  } = useAuth();

  // ==========================================
  // CARRITO GLOBAL CON REACT CONTEXT
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
  // ESTADOS DE ADMINISTRACION LOCAL
  // ==========================================

  const [categorias, setCategorias] =
    useState(getCategorias);

  const [usuarios, setUsuarios] =
    useState(getUsuarios);

  const [ordenes, setOrdenes] =
    useState(getOrdenes);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] = useState("Todas");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [productoEditando, setProductoEditando] =
    useState(null);

  const [modoAdmin, setModoAdmin] =
    useState(false);

  // ==========================================
  // NAVEGACION
  // ==========================================

  const navigate = useNavigate();
  const location = useLocation();

  const esRutaAdmin =
    location.pathname.startsWith("/admin");

  // ==========================================
  // ADMINISTRACION DE USUARIOS
  // TODAVIA LOCAL
  // ==========================================

  const handleCrearUsuario = (datos) => {
    setUsuarios(crearUsuario(datos));
  };

  const handleActualizarUsuario = (id, cambios) => {

    const datos = usuarioActual?.id === id
      ? {
          ...cambios,
          rol: usuarioActual.rol,
        }
      : cambios;

    setUsuarios(
      actualizarUsuario(id, datos)
    );
  };

  const handleEliminarUsuario = (id) => {

    if (usuarioActual?.id === id) {
      alert("No puedes eliminar tu propio usuario");
      return;
    }

    setUsuarios(eliminarUsuario(id));
  };

  // ==========================================
  // CERRAR SESION
  // ==========================================

  const handleLogout = () => {

    cerrarSesion();

    vaciarCarrito();

    setModoAdmin(false);
    setMostrarFormulario(false);
    setProductoEditando(null);

    navigate("/");
  };

  // ==========================================
  // COMPRA ANTIGUA LOCAL
  // PENDIENTE DE ELIMINAR
  // ==========================================

  const handleCompraExitosa = (orden) => {

    setOrdenes(
      crearOrden(orden)
    );

    setProductos(
      descontarStock(orden.productos)
    );

    if (!usuarioActual) return;

    setUsuarios(
      agregarCompra(usuarioActual.id, orden)
    );
  };

  // ==========================================
  // FUNCIONES DEL CARRITO
  // ==========================================

  const handleAddToCart = agregarAlCarrito;

  const handleClearCart = vaciarCarrito;

  const handleRemoveFromCart = eliminarDelCarrito;

  const handleIncreaseQuantity = aumentarCantidad;

  const handleDecreaseQuantity = disminuirCantidad;

  // ==========================================
  // ADMINISTRACION DE PRODUCTOS
  // TODAVIA LOCAL
  // ==========================================

  const handleSaveProduct = (datos) => {

    if (productoEditando) {

      setProductos(
        actualizarProducto(
          productoEditando.id,
          datos
        )
      );

      setProductoEditando(null);

    } else {

      setProductos(
        crearProducto(datos)
      );
    }

    setMostrarFormulario(false);
  };

  const handleDeleteProduct = (id) => {

    setProductos(
      eliminarProducto(id)
    );
  };

  const handleCrearProducto = (datos) => {

    setProductos(
      crearProducto(datos)
    );
  };

  const handleActualizarProducto = (id, datos) => {

    setProductos(
      actualizarProducto(id, datos)
    );
  };

  // ==========================================
  // ADMINISTRACION DE CATEGORIAS
  // TODAVIA LOCAL
  // ==========================================

  const handleCrearCategoria = (datos) => {

    setCategorias(
      crearCategoria(datos)
    );
  };

  const handleActualizarCategoria = (id, cambios) => {

    const anterior = categorias.find(
      (categoria) => categoria.id === id
    );

    setCategorias(
      actualizarCategoria(id, cambios)
    );

    if (
      anterior &&
      cambios.nombre &&
      cambios.nombre !== anterior.nombre
    ) {

      setProductos(
        renombrarCategoriaProductos(
          anterior.nombre,
          cambios.nombre
        )
      );
    }
  };

  const handleEliminarCategoria = (id) => {

    setCategorias(
      eliminarCategoria(id)
    );
  };

  // ==========================================
  // FORMULARIO DE PRODUCTOS
  // ==========================================

  const handleEditProduct = (producto) => {

    setProductoEditando(producto);
    setMostrarFormulario(true);

    setTimeout(() => {
      document
        .getElementById("formulario-admin")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  const handleNewProduct = () => {

    setProductoEditando(null);
    setMostrarFormulario(true);

    setTimeout(() => {
      document
        .getElementById("formulario-admin")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  // ==========================================
  // BUSQUEDA Y FILTROS
  // ==========================================

  const productosFiltrados = productos.filter(
    (producto) => {

      const coincideNombre = producto.nombre
        .toLowerCase()
        .includes(
          busqueda.toLowerCase()
        );

      const coincideCategoria =
        categoriaSeleccionada === "Todas" ||
        producto.categoria === categoriaSeleccionada;

      return coincideNombre && coincideCategoria;
    }
  );

  // ==========================================
  // INTERFAZ PRINCIPAL
  // ==========================================

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">

      {/* ==================================== */}
      {/* NAVBAR */}
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

                <Link
                  className="nav-link"
                  to="/"
                >
                  Inicio
                </Link>

                <Link
                  className="nav-link"
                  to="/productos"
                >
                  Productos
                </Link>

                <Link
                  className="nav-link"
                  to="/categorias"
                >
                  Categorías
                </Link>

                <Link
                  className="nav-link"
                  to="/ofertas"
                >
                  Ofertas
                </Link>

                <Link
                  className="nav-link"
                  to="/blog"
                >
                  Blog
                </Link>

                <Link
                  className="nav-link"
                  to="/nosotros"
                >
                  Nosotros
                </Link>

                <Link
                  className="nav-link"
                  to="/contacto"
                >
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

                    <Link
                      className="nav-link"
                      to="/mis-compras"
                    >
                      📦 Mis Compras
                    </Link>

                  </>

                )}

                {/* ================================= */}
                {/* NUEVO: PANEL VENDEDOR */}
                {/* ================================= */}

                {usuarioActual?.rol === "vendedor" && (

                  <Link
                    className="nav-link"
                    to="/vendedor/ordenes"
                  >
                    🧾 Panel Vendedor
                  </Link>

                )}

                {/* CARRITO */}

                <Link
                  className="nav-link"
                  to="/carrito"
                >
                  🛒 ({carrito.length})
                </Link>

              </div>

              {/* ================================= */}
              {/* BUSCADOR Y ADMINISTRACION */}
              {/* ================================= */}

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

                {/* SOLO ADMIN */}

                {usuarioActual?.rol === "admin" && (

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
                      onClick={() => {

                        setModoAdmin(!modoAdmin);

                        setMostrarFormulario(false);

                        setProductoEditando(null);

                      }}
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

        {/* ================================= */}
        {/* INICIO */}
        {/* ================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ================================= */}
        {/* PRODUCTOS */}
        {/* ================================= */}

        <Route
          path="/productos"
          element={

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
              onAddToCart={handleAddToCart}
              onDelete={handleDeleteProduct}
              onEdit={handleEditProduct}
              modoAdmin={modoAdmin}
              onNewProduct={handleNewProduct}
            />

          }
        />

        {/* ================================= */}
        {/* CATEGORIAS */}
        {/* ================================= */}

        <Route
          path="/categorias"
          element={

            <Categoria
              categorias={categorias}
              productos={productos}
              onAddToCart={handleAddToCart}
            />

          }
        />

        <Route
          path="/categorias/:nombre"
          element={

            <Categoria
              categorias={categorias}
              productos={productos}
              onAddToCart={handleAddToCart}
            />

          }
        />

        {/* ================================= */}
        {/* OFERTAS */}
        {/* ================================= */}

        <Route
          path="/ofertas"
          element={

            <Ofertas
              productos={productos}
              onAddToCart={handleAddToCart}
            />

          }
        />

        {/* ================================= */}
        {/* CARRITO */}
        {/* ================================= */}

        <Route
          path="/carrito"
          element={

            <Carrito
              carrito={carrito}
              onRemove={handleRemoveFromCart}
              onIncrease={handleIncreaseQuantity}
              onDecrease={handleDecreaseQuantity}
            />

          }
        />

        {/* ================================= */}
        {/* CHECKOUT */}
        {/* ================================= */}

        <Route
          path="/checkout"
          element={

            <Checkout
              carrito={carrito}
              productos={productos}
              onClearCart={handleClearCart}
              usuarioActual={usuarioActual}
              onCompraExitosa={handleCompraExitosa}
            />

          }
        />

        {/* ================================= */}
        {/* RESULTADOS DE COMPRA */}
        {/* ================================= */}

        <Route
          path="/compra-exitosa"
          element={<CompraExitosa />}
        />

        <Route
          path="/compra-fallida"
          element={<CompraFallida />}
        />

        {/* ================================= */}
        {/* DETALLE DE PRODUCTO */}
        {/* ================================= */}

        <Route
          path="/productos/:id"
          element={

            <ProductDetail
              productos={productos}
              onAddToCart={handleAddToCart}
            />

          }
        />

        {/* ================================= */}
        {/* REGISTRO Y LOGIN */}
        {/* ================================= */}

        <Route
          path="/registro"
          element={<Registro />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ================================= */}
        {/* MIS COMPRAS - CLIENTES */}
        {/* ================================= */}

        <Route
          path="/mis-compras"
          element={<MisCompras />}
        />

        {/* ================================= */}
        {/* INFORMACION DE LA TIENDA */}
        {/* ================================= */}

        <Route
          path="/nosotros"
          element={<Nosotros />}
        />

        <Route
          path="/contacto"
          element={<Contacto />}
        />

        {/* ================================= */}
        {/* BLOG */}
        {/* ================================= */}

        <Route
          path="/blog"
          element={<Blog />}
        />

        <Route
          path="/blog/:id"
          element={<BlogDetail />}
        />

        {/* ========================================== */}
        {/* NUEVO: PANEL EXCLUSIVO DEL VENDEDOR */}
        {/* ========================================== */}

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

        {/* ========================================== */}
        {/* PANEL ADMINISTRADOR */}
        {/* ========================================== */}

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

          {/* DASHBOARD */}

          <Route
            index
            element={

              <Dashboard
                productos={productos}
                usuarios={usuarios}
                ordenes={ordenes}
              />

            }
          />

          {/* ORDENES ADMIN */}

          <Route
            path="ordenes"
            element={
              <Ordenes ordenes={ordenes} />
            }
          />

          <Route
            path="ordenes/:numero"
            element={
              <BoletaAdmin ordenes={ordenes} />
            }
          />

          {/* USUARIOS */}

          <Route
            path="usuarios"
            element={

              <UsuariosAdmin
                usuarios={usuarios}
                onDelete={handleEliminarUsuario}
              />

            }
          />

          <Route
            path="usuarios/nuevo"
            element={

              <AdminUsuarioForm
                usuarios={usuarios}
                onCreate={handleCrearUsuario}
              />

            }
          />

          <Route
            path="usuarios/:id/editar"
            element={

              <AdminUsuarioForm
                usuarios={usuarios}
                onUpdate={handleActualizarUsuario}
              />

            }
          />

          {/* PRODUCTOS ADMIN */}

          <Route
            path="productos"
            element={

              <AdminProductos
                productos={productos}
                onDelete={handleDeleteProduct}
              />

            }
          />

          <Route
            path="productos/nuevo"
            element={

              <AdminProductoForm
                productos={productos}
                categorias={categorias}
                onCreate={handleCrearProducto}
                onUpdate={handleActualizarProducto}
              />

            }
          />

          <Route
            path="productos/:id/editar"
            element={

              <AdminProductoForm
                productos={productos}
                categorias={categorias}
                onCreate={handleCrearProducto}
                onUpdate={handleActualizarProducto}
              />

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

          {/* CATEGORIAS ADMIN */}

          <Route
            path="categorias"
            element={

              <AdminCategorias
                categorias={categorias}
                productos={productos}
                onCreate={handleCrearCategoria}
                onUpdate={handleActualizarCategoria}
                onDelete={handleEliminarCategoria}
              />

            }
          />

        </Route>

      </Routes>

      {/* ==================================== */}
      {/* FORMULARIO ADMINISTRATIVO */}
      {/* ==================================== */}

      {mostrarFormulario && (

        <div
          id="formulario-admin"
          className="container my-4 flex-grow-1"
        >

          <div className="row justify-content-center">

            <div className="col-md-8">

              <ProductForm
                onSave={handleSaveProduct}
                productoEditando={productoEditando}
                categorias={categorias}
              />

            </div>

          </div>

        </div>

      )}

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
