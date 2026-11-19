
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useLocation } from "react-router-dom";
import api from "../services/api";

export default function useCategoriasApi() {

  // ==========================================
  // ESTADOS
  // ==========================================

  const [categorias, setCategorias] = useState([]);

  const [cargandoCategorias, setCargandoCategorias] =
    useState(true);

  const [errorCategorias, setErrorCategorias] =
    useState(null);

  const [recarga, setRecarga] = useState(0);

  const { pathname } = useLocation();

  // ==========================================
  // ACTUALIZAR CATEGORIAS MANUALMENTE
  // ==========================================

  const recargarCategorias = useCallback(() => {
    setRecarga((anterior) => anterior + 1);
  }, []);

  // ==========================================
  // CONSULTAR CATEGORIAS DESDE MYSQL
  // ==========================================

  useEffect(() => {

    const controller = new AbortController();

    const cargarCategorias = async () => {

      setCargandoCategorias(true);
      setErrorCategorias(null);

      try {

        // GET /api/v1/categorias

        const respuesta = await api.get(
          "/categorias",
          {
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        if (!Array.isArray(respuesta.data)) {
          throw new Error(
            "La API devolvió un formato de categorías incorrecto."
          );
        }

        setCategorias(respuesta.data);

      } catch (err) {

        if (controller.signal.aborted) return;

        console.error(
          "Error al cargar categorías:",
          err
        );

        setErrorCategorias(
          "No se pudieron cargar las categorías desde MySQL."
        );

      } finally {

        if (!controller.signal.aborted) {
          setCargandoCategorias(false);
        }

      }

    };

    cargarCategorias();

    return () => controller.abort();

  }, [pathname, recarga]);

  // ==========================================
  // DEVOLVER DATOS A LOS COMPONENTES
  // ==========================================

  return {
    categorias,
    cargandoCategorias,
    errorCategorias,
    recargarCategorias,
  };

}
