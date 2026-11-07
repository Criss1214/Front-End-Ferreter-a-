import api from "./api";
import type { VentasCategoria } from "../types/categoria";

export const reporteVentasCategoria = async (): Promise<VentasCategoria[]> => {
  const { data } = await api.get<VentasCategoria[]>("/categorias/reporteVentasCategoria");
  return data;
};
