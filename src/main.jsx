
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";

import { BrowserRouter } from "react-router-dom";

// Contextos de la aplicación
import { AuthProvider } from "./context/AuthContext";
import { CarritoProvider } from "./context/CarritoContext";

// Estilos
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";

// Iniciar React
ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <App />
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
