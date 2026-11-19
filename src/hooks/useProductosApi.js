
import { useEffect, useState } from "react";
import api from "../services/api";

export default function useProductosApi() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const cargarProductos = async () => {
      try {
        setCargando(true);
        setError(null);

        const respuesta = await api.get("/productos", {
          signal: controller.signal,
        });

        setProductos(respuesta.data);

      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error al obtener productos:", err);
          setError("No se pudieron cargar los productos.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargarProductos();

    return () => controller.abort();
  }, []);

  return {
    productos,
    setProductos,
    cargando,
    error,
  };
}
