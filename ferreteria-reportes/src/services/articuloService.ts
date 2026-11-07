import api from "./api";
import type { Articulo, ArticuloCategoria } from "../types/articulo";

export const mostrarActivosFiltro = async (nombre: string): Promise<Articulo[]> => {
  const { data } = await api.get<Articulo[]>("/articulos/mostrarActivosFiltro", {
    params: { nombre },
  });
  return data;
};

export const reporteArticuloCategoria = async (): Promise<ArticuloCategoria[]> => {
  const { data } = await api.get<ArticuloCategoria[]>("/articulos/reporteArticuloCategoria");
  return data;
};
