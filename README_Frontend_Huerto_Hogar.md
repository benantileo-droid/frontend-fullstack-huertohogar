# 🌱 Huerto Hogar — Frontend

Aplicación web de comercio electrónico de productos agrícolas y orgánicos, desarrollada con **React, Vite y Bootstrap**. Consume una API REST de Spring Boot para gestionar el catálogo, las categorías, la autenticación, las compras y las funciones administrativas.

**Proyecto académico:** Desarrollo Fullstack II (DSY1104) · Duoc UC.

> **Alcance:** Huerto Hogar utiliza un flujo de compra académico/simulado. La creación de boletas y el descuento de stock se registran en el backend, pero **no hay una pasarela de pagos real**. El estado `PENDIENTE` no acredita un pago.

## Funcionalidades

- Catálogo de productos con búsqueda, filtrado por categorías, ofertas, stock y detalle individual.
- Carrito de compras: agregar y quitar productos, aumentar/disminuir cantidades y calcular totales.
- Registro e inicio de sesión mediante la API, con **JWT** y roles `CLIENTE`, `VENDEDOR` y `ADMIN`.
- Checkout que registra compras a través del backend; historial de **Mis Compras**.
- Panel del vendedor para consultar las órdenes registradas.
- Panel de administración con dashboard, gestión de productos y categorías, listado de órdenes y boletas, consulta de usuarios y modificación de roles.
- Vistas complementarias: inicio, ofertas, nosotros, contacto y blog.
- Pruebas automatizadas de componentes, hooks y autenticación con **Jasmine + Karma**.

## Tecnologías principales

| Área | Tecnología |
| --- | --- |
| Interfaz | React 19, JSX, Bootstrap 5 |
| Entorno de desarrollo | Vite 8 |
| Navegación | React Router 7 |
| Cliente HTTP | Axios |
| Estado compartido | React Context (`AuthContext` y `CarritoContext`) |
| Pruebas | Jasmine, Karma, React Testing Library, Chrome Headless |
| Informes de cobertura | Istanbul / `karma-coverage` |

## Requisitos previos

- Node.js y npm compatibles con las versiones de Vite y React declaradas en `package.json`.
- El **backend de Huerto Hogar** configurado y en ejecución en `http://localhost:8081` para utilizar las funcionalidades que requieren API.
- Navegador moderno. Para ejecutar las pruebas con la configuración actual de Karma, se necesita Chrome/Chromium disponible para `ChromeHeadless`.

## Instalación y ejecución

Desde la carpeta raíz del proyecto frontend:

```bash
npm install
npm run dev
```

Abre la dirección que indique Vite en la terminal; en nuestra configuración local habitual es:

```text
http://localhost:5173
```

### Configuración de la API

El cliente Axios se encuentra en:

```text
src/services/api.js
```

Verifica que su `baseURL` apunte al backend, por ejemplo:

```js
baseURL: "http://localhost:8081/api/v1"
```

Si ejecutas el backend en otro equipo o puerto, actualiza la dirección de acuerdo con tu entorno. Verifica también que el backend permita el origen del frontend mediante CORS.

## Comandos disponibles

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite |
| `npm run build` | Genera el frontend de producción en `dist/` |
| `npm run preview` | Previsualiza la compilación de producción |
| `npm test` | Ejecuta Jasmine con Karma (`karma.conf.cjs`) |
| `npm run lint` | Ejecuta Oxlint |

## Organización del proyecto

```text
src/
├── components/         # Componentes reutilizables
├── context/            # AuthContext y CarritoContext
├── hooks/              # useProductosApi, useCategoriasApi
├── pages/              # Tienda, autenticación, compras, etc.
│   └── admin/          # Dashboard, órdenes, usuarios, productos, categorías
├── services/
│   └── api.js          # Configuración de Axios
├── test/               # Pruebas Jasmine
├── utils/              # Funciones auxiliares (por ejemplo, precios)
├── App.jsx             # Rutas y composición principal
└── main.jsx            # Punto de entrada y providers
```

La estructura se muestra de forma resumida; puede contener otros archivos y carpetas.

## Rutas principales

| Ruta | Descripción | Acceso |
| --- | --- | --- |
| `/` | Inicio | Público |
| `/productos` | Catálogo | Público |
| `/productos/:id` | Detalle de producto | Público |
| `/categorias` y `/categorias/:nombre` | Categorías | Público |
| `/ofertas` | Ofertas | Público |
| `/carrito` | Carrito | Público |
| `/registro` y `/login` | Registro y acceso | Público |
| `/checkout` | Confirmación de compra | Según validaciones del flujo |
| `/mis-compras` | Historial del usuario | CLIENTE / ADMIN |
| `/vendedor/ordenes` | Consulta de órdenes | VENDEDOR |
| `/admin` | Dashboard | ADMIN |
| `/admin/productos` | Productos administrativos | ADMIN |
| `/admin/categorias` | Categorías administrativas | ADMIN |
| `/admin/ordenes` | Órdenes | ADMIN |
| `/admin/ordenes/:numero` | Boleta individual | ADMIN |
| `/admin/usuarios` | Usuarios y cambios de rol | ADMIN |

> La visibilidad de rutas y botones en React **no sustituye la seguridad del servidor**. Spring Security comprueba los permisos reales para cada endpoint protegido.

## Autenticación y roles

La sesión se gestiona desde `AuthContext.jsx` mediante un JWT recibido del endpoint de login. El token se conserva en el navegador con la clave `huerto_hogar_token` y se envía en las solicitudes autenticadas.

El frontend interpreta los datos del token para mostrar la interfaz, pero **no verifica su firma criptográfica**: esa responsabilidad corresponde al backend. Si se modifica el rol de una cuenta, es necesario volver a iniciar sesión para obtener un JWT actualizado.

No publiques contraseñas, tokens JWT ni credenciales de cuentas reales en el repositorio.

## Pruebas automatizadas

Ejecuta:

```bash
npm test
```

La configuración se encuentra en `karma.conf.cjs`. Los archivos de pruebas están en `src/test/` y utilizan Jasmine, React Testing Library y respuestas simuladas de la API para no depender de MySQL en cada ejecución.

Los reportes se generan en:

```text
coverage/html/
reporte-tests/
```

**Última comprobación local documentada (20-11-2026):** 24 pruebas frontend aprobadas. Esta cifra corresponde a la versión verificada en esa fecha y puede variar con futuros cambios. La cobertura de Karma se aplica a los archivos instrumentados, **no necesariamente a todo el proyecto**.

## Solución de problemas frecuentes

- **No cargan los productos:** comprueba que Spring Boot esté encendido y que la URL de Axios corresponda al backend.
- **Error `401 Unauthorized`:** vuelve a iniciar sesión; el token podría estar ausente, vencido o desactualizado.
- **Error `403 Forbidden`:** verifica que la cuenta tenga el rol necesario. El backend decide el acceso.
- **Dos cuentas se interfieren en el navegador:** distintas pestañas del mismo perfil comparten `localStorage`. Para probar ADMIN y VENDEDOR simultáneamente, utiliza perfiles de navegador distintos o una ventana privada.
- **Pruebas Karma no arrancan:** comprueba la instalación de dependencias y la disponibilidad de Chrome/Chromium.

## Backend y persistencia

Los productos, las categorías, las boletas y los usuarios administrados desde la aplicación se obtienen a través del backend Spring Boot y su base de datos MySQL. El carrito y otros estados temporales de la interfaz pueden manejarse en el navegador.

Para instalar y configurar el servidor, consulta el README del repositorio **backend**.

## Estado del proyecto

Proyecto académico en desarrollo y preparación de entrega. La revisión final incluye ejecutar `npm run build`, `npm test` y comprobar el flujo de los tres roles junto con el backend.
