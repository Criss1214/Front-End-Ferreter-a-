import api from "./api";
import type { ClienteFactura, ClienteFacturaDetalle } from "../types/cliente";

export const reporteClienteFactura = async (): Promise<ClienteFactura[]> => {
  const { data } = await api.get<ClienteFactura[]>("/clientes/reporteClienteFactura");
  return data;
};

export const reporteClienteFacturaDetalle = async (): Promise<ClienteFacturaDetalle[]> => {
  const { data } = await api.get<ClienteFacturaDetalle[]>("/clientes/reporteClienteFacturaDetalle");
  return data;
};
