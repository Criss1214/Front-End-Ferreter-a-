// ClienteFacturaDTO (la fecha llega ya formateada: dd/MM/yyyy HH:mm)
export interface ClienteFactura {
  nombreCliente: string;
  apellidoCliente: string;
  nit: string;
  fechaFactura: string;
  total: number;
}

// ClienteFacturaDetalleDTO
export interface ClienteFacturaDetalle {
  nombreCliente: string;
  apellidoCliente: string;
  fechaFactura: string;
  nombreArticulo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
