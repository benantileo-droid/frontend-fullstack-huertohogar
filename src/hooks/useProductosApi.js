
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";

export default function useProductosApi() {

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Detectar cuando cambiamos de pagina
  const { pathname } = useLocation();

  useEffect(() => {

    const controller = new AbortController();

    const cargarProductos = async () => {

      setCargando(true);
      setError(null);

      try {

        // Consultar productos actualizados en MySQL
        const respuesta = await api.get("/productos", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setProductos(respuesta.data);
        }

      } catch (err) {

        if (!controller.signal.aborted) {
          console.error(
            "Error al cargar productos:",
            err
          );

          setError(
            "No se pudieron cargar los productos."
          );
        }

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false);
        }

      }
    };

    cargarProductos();

    // Cancelar la solicitud anterior si cambia la ruta
    return () => controller.abort();

  }, [pathname]);

  return {
    productos,
    setProductos,
    cargando,
    error,
  };
}
