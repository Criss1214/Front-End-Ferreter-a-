// ArticuloDTO
export interface Articulo {
  idArticulo: number;
  nombre: string;
  marca: string;
  precio: number;
  stock: number;
}

// ArticuloCategoriaDTO
export interface ArticuloCategoria {
  nombreArticulo: string;
  marca: string;
  nombreCategoria: string;
  precio: number;
  stock: number;
}
