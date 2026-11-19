
import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import useProductosApi from "./hooks/useProductosApi";
import { precioFinal } from "./utils/precios";
import {
  crearProducto, actualizarProducto, eliminarProducto,
  getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, agregarCompra,
  getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria,
  getOrdenes, crearOrden, descontarStock, renombrarCategoriaProductos,
} from "./data/db";

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

  // =========================
  // PRODUCTOS DESDE MYSQL
  // =========================

  const {
    productos,
    setProductos,
    cargando,
    error,
    cargandoProductos,
    errorProductos,
    recargarProductos,
  } = useProductosApi();

  // =========================
  // ESTADOS LOCALES
  // =========================

  const [categorias, setCategorias] = useState(getCategorias);
  const [usuarios, setUsuarios] = useState(getUsuarios);
  const [ordenes, setOrdenes] = useState(getOrdenes);

  const [carrito, setCarrito] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("carrito")) || [];
    } catch {
      return [];
    }
  });

  const [usuarioActual, setUsuarioActual] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuarioActual")) || null;
    } catch {
      return null;
    }
  });

  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [modoAdmin, setModoAdmin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const esRutaAdmin = location.pathname.startsWith("/admin");

  // =========================
  // GUARDAR SESION Y CARRITO
  // =========================

  useEffect(() => {
    if (usuarioActual) {
      localStorage.setItem(
        "usuarioActual",
        JSON.stringify(usuarioActual)
      );
    } else {
      localStorage.removeItem("usuarioActual");
    }
  }, [usuarioActual]);

  useEffect(() => {
    localStorage.setItem(
      "carrito",
      JSON.stringify(carrito)
    );
  }, [carrito]);

  // =========================
  // USUARIOS
  // =========================

  const handleRegisterUser = (nuevoUsuario) => {
    setUsuarios(crearUsuario(nuevoUsuario));
  };

  const handleLogin = (usuario) => {
    setUsuarioActual(usuario);
  };

  const handleCrearUsuario = (datos) => {
    setUsuarios(crearUsuario(datos));
  };

  const handleActualizarUsuario = (id, cambios) => {
    const seguros = usuarioActual?.id === id
      ? { ...cambios, rol: usuarioActual.rol }
      : cambios;

    setUsuarios(actualizarUsuario(id, seguros));

    if (usuarioActual?.id === id) {
      setUsuarioActual((actual) => ({
        ...actual,
        ...seguros,
      }));
    }
  };

  const handleEliminarUsuario = (id) => {
    if (usuarioActual?.id === id) {
      alert("No puedes eliminar tu propio usuario");
      return;
    }

    setUsuarios(eliminarUsuario(id));
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    setModoAdmin(false);
    setMostrarFormulario(false);
    setProductoEditando(null);
    navigate("/");
  };

  // =========================
  // COMPRA ANTIGUA
  // PENDIENTE CONECTAR A MYSQL
  // =========================

  const handleCompraExitosa = (orden) => {
    setOrdenes(crearOrden(orden));

    setProductos(descontarStock(orden.productos));

    if (!usuarioActual) return;

    setUsuarios(agregarCompra(usuarioActual.id, orden));

    setUsuarioActual((actual) => ({
      ...actual,
      compras: [...(actual.compras || []), orden],
    }));
  };

  // =========================
  // CARRITO DE COMPRAS
  // =========================

  const handleAddToCart = (producto) => {
    const stock = typeof producto.stock === "number"
      ? producto.stock
      : Infinity;

    const cantidadActual = carrito.find(
      (p) => p.id === producto.id
    )?.cantidad || 0;

    if (stock <= 0) {
      alert("Producto sin stock");
      return;
    }

    if (cantidadActual >= stock) {
      alert(
        `Solo quedan ${stock} unidades de ${producto.nombre}`
      );
      return;
    }

    setCarrito((actual) => {
      const existe = actual.find(
        (p) => p.id === producto.id
      );

      if (existe) {
        return actual.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }

      return [
        ...actual,
        {
          ...producto,
          precio: precioFinal(producto),
          cantidad: 1,
        },
      ];
    });
  };

  const handleClearCart = () => {
    setCarrito([]);
  };

  const handleRemoveFromCart = (id) => {
    setCarrito((actual) =>
      actual.filter((p) => p.id !== id)
    );
  };

  const handleIncreaseQuantity = (id) => {
    const producto = productos.find((p) => p.id === id);

    const stock = typeof producto?.stock === "number"
      ? producto.stock
      : Infinity;

    const cantidadActual = carrito.find(
      (p) => p.id === id
    )?.cantidad || 0;

    if (cantidadActual >= stock) {
      alert("No hay más stock disponible");
      return;
    }

    setCarrito((actual) =>
      actual.map((p) =>
        p.id === id
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      )
    );
  };

  const handleDecreaseQuantity = (id) => {
    setCarrito((actual) =>
      actual
        .map((p) =>
          p.id === id
            ? { ...p, cantidad: p.cantidad - 1 }
            : p
        )
        .filter((p) => p.cantidad > 0)
    );
  };

  // =========================
  // ADMINISTRACION DE PRODUCTOS
  // PENDIENTE CONECTAR A LA API
  // =========================

  const handleSaveProduct = (datos) => {
    if (productoEditando) {
      setProductos(
        actualizarProducto(productoEditando.id, datos)
      );
      setProductoEditando(null);
    } else {
      setProductos(crearProducto(datos));
    }

    setMostrarFormulario(false);
  };

  const handleDeleteProduct = (id) => {
    setProductos(eliminarProducto(id));
  };

  const handleCrearProducto = (datos) => {
    setProductos(crearProducto(datos));
  };

  const handleActualizarProducto = (id, datos) => {
    setProductos(actualizarProducto(id, datos));
  };

  // =========================
  // ADMINISTRACION DE CATEGORIAS
  // =========================

  const handleCrearCategoria = (datos) => {
    setCategorias(crearCategoria(datos));
  };

  const handleActualizarCategoria = (id, cambios) => {
    const anterior = categorias.find(
      (c) => c.id === id
    );

    setCategorias(actualizarCategoria(id, cambios));

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
    setCategorias(eliminarCategoria(id));
  };

  // =========================
  // FORMULARIO ADMIN
  // =========================

  const handleEditProduct = (producto) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);

    setTimeout(() => {
      document
        .getElementById("formulario-admin")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleNewProduct = () => {
    setProductoEditando(null);
    setMostrarFormulario(true);

    setTimeout(() => {
      document
        .getElementById("formulario-admin")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // =========================
  // BUSQUEDA Y FILTROS
  // =========================

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(
      busqueda.toLowerCase()
    ) &&
    (
      categoriaSeleccionada === "Todas" ||
      p.categoria === categoriaSeleccionada
    )
  );

  // =========================
  // INTERFAZ PRINCIPAL
  // =========================

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">

      {/* NAVBAR */}

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

                {!usuarioActual ? (
                  <>
                    <Link
                      className="nav-link"
                      to="/registro"
                    >
                      Registro
                    </Link>

                    <Link
                      className="nav-link text-nowrap"
                      to="/login"
                    >
                      Iniciar Sesión
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="nav-link text-white-50 text-nowrap">
                      👤 {usuarioActual.nombre}
                    </span>

                    <button
                      className="btn btn-link nav-link text-nowrap"
                      onClick={handleLogout}
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}

                <Link
                  className="nav-link text-nowrap"
                  to="/carrito"
                >
                  🛒 ({carrito.length})
                </Link>

              </div>

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

                {usuarioActual?.rol === "admin" && (
                  <>
                    <Link
                      to="/admin"
                      className="btn btn-outline-light rounded-pill text-nowrap"
                    >
                      📊 Dashboard
                    </Link>

                    <button
                      className="btn btn-outline-light rounded-pill text-nowrap"
                      onClick={() => {
                        setModoAdmin(!modoAdmin);
                        setMostrarFormulario(false);
                        setProductoEditando(null);
                      }}
                    >
                      {modoAdmin ? "Salir Admin" : "⚙️ Admin"}
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

      {/* ========================= */}
      {/* RUTAS DE LA TIENDA */}
      {/* ========================= */}

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/productos"
          element={
            <Productos
              productos={productos}
              categorias={categorias}
              productosFiltrados={productosFiltrados}
              cargandoProductos={
                cargandoProductos ?? cargando ?? false
              }
              errorProductos={
                errorProductos ?? error ?? ""
              }
              recargarProductos={
                recargarProductos ||
                (() => window.location.reload())
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

        <Route
          path="/ofertas"
          element={
            <Ofertas
              productos={productos}
              onAddToCart={handleAddToCart}
            />
          }
        />

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

        <Route
          path="/compra-exitosa"
          element={<CompraExitosa />}
        />

        <Route
          path="/compra-fallida"
          element={<CompraFallida />}
        />

        <Route
          path="/productos/:id"
          element={
            <ProductDetail
              productos={productos}
              onAddToCart={handleAddToCart}
            />
          }
        />

        <Route
          path="/registro"
          element={
            <Registro
              onRegister={handleRegisterUser}
              usuarios={usuarios}
            />
          }
        />

        <Route
          path="/login"
          element={
            <Login
              usuarios={usuarios}
              onLogin={handleLogin}
            />
          }
        />

        <Route
          path="/nosotros"
          element={<Nosotros />}
        />

        <Route
          path="/contacto"
          element={<Contacto />}
        />

        <Route
          path="/blog"
          element={<Blog />}
        />

        <Route
          path="/blog/:id"
          element={<BlogDetail />}
        />

        {/* ========================= */}
        {/* PANEL ADMINISTRADOR */}
        {/* ========================= */}

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

          <Route
            path="ordenes"
            element={<Ordenes ordenes={ordenes} />}
          />

          <Route
            path="ordenes/:numero"
            element={<BoletaAdmin ordenes={ordenes} />}
          />

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

          <Route
            path="productos-criticos"
            element={
              <ProductosCriticos productos={productos} />
            }
          />

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

      {/* FORMULARIO DE PRODUCTOS */}

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

      {/* FOOTER */}

      <footer className="bg-dark text-white py-4 mt-5 d-print-none">
        <div className="container text-center">

          <p className="m-0 fw-light">
            🌱 <strong>Huerto Hogar</strong> - Evaluación FullStack DSY1104 | Duoc UC
          </p>

          <small className="text-secondary">
            Desarrollado con React, Bootstrap, Jasmine y Karma
          </small>

        </div>
      </footer>

    </div>
  );
}
