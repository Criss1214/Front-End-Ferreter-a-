import { useRef, useState, type ReactNode } from "react";
import logo from "../assets/logo.png";
import { MARCA } from "../marca";
import { exportarExcel, exportarPDF, type ConfigReporte } from "../utils/exportar";
import { mostrarActivosFiltro, reporteArticuloCategoria } from "../services/articuloService";
import { reporteClienteFactura, reporteClienteFacturaDetalle } from "../services/clienteService";
import { reporteVentasCategoria } from "../services/categoriaService";
import type { Articulo, ArticuloCategoria } from "../types/articulo";
import type { ClienteFactura, ClienteFacturaDetalle } from "../types/cliente";
import type { VentasCategoria } from "../types/categoria";

type Formato = "pdf" | "excel";

// ---------------------------------------------------------------------
// Configuración de cada reporte (cada uno con su propio nombre de archivo)
// ---------------------------------------------------------------------
const configArticulosNombre: ConfigReporte<Articulo> = {
  titulo: "Artículos por nombre",
  archivo: "articulosPorNombre",
  columnas: [
    { titulo: "Nombre", valor: (a) => a.nombre, ancho: 36 },
    { titulo: "Marca", valor: (a) => a.marca, ancho: 22 },
    { titulo: "Precio", valor: (a) => a.precio, tipo: "decimal", ancho: 14 },
    { titulo: "Stock", valor: (a) => a.stock, tipo: "entero", ancho: 10 },
  ],
};

const configArticulosCategoria: ConfigReporte<ArticuloCategoria> = {
  titulo: "Artículos con su categoría",
  archivo: "articulosCategoria",
  columnas: [
    { titulo: "Artículo", valor: (a) => a.nombreArticulo, ancho: 36 },
    { titulo: "Marca", valor: (a) => a.marca, ancho: 22 },
    { titulo: "Categoría", valor: (a) => a.nombreCategoria, ancho: 26 },
    { titulo: "Precio", valor: (a) => a.precio, tipo: "decimal", ancho: 14 },
    { titulo: "Stock", valor: (a) => a.stock, tipo: "entero", ancho: 10 },
  ],
};

const configFacturasCliente: ConfigReporte<ClienteFactura> = {
  titulo: "Facturas por cliente",
  archivo: "facturasCliente",
  columnas: [
    // nombre y apellido en una sola columna
    { titulo: "Cliente", valor: (f) => `${f.nombreCliente} ${f.apellidoCliente}`, ancho: 32 },
    { titulo: "NIT", valor: (f) => f.nit, ancho: 16 },
    { titulo: "Fecha", valor: (f) => f.fechaFactura, ancho: 20 },
    { titulo: "Total", valor: (f) => f.total, tipo: "decimal", ancho: 14 },
  ],
};

const configDetalleFacturas: ConfigReporte<ClienteFacturaDetalle> = {
  titulo: "Detalle de facturas",
  archivo: "detalleFacturas",
  columnas: [
    { titulo: "Cliente", valor: (d) => `${d.nombreCliente} ${d.apellidoCliente}`, ancho: 30 },
    { titulo: "Fecha", valor: (d) => d.fechaFactura, ancho: 20 },
    { titulo: "Artículo", valor: (d) => d.nombreArticulo, ancho: 36 },
    { titulo: "Cantidad", valor: (d) => d.cantidad, tipo: "entero", ancho: 12 },
    { titulo: "Precio unitario", valor: (d) => d.precioUnitario, tipo: "decimal", ancho: 16 },
    { titulo: "Subtotal", valor: (d) => d.subtotal, tipo: "decimal", ancho: 14 },
  ],
  totalGeneral: [5],
};

const configVentasCategoria: ConfigReporte<VentasCategoria> = {
  titulo: "Ventas por categoría",
  archivo: "ventasCategoria",
  columnas: [
    { titulo: "Categoría", valor: (v) => v.nombreCategoria, ancho: 30 },
    { titulo: "Artículos vendidos", valor: (v) => v.cantidadVendida, tipo: "entero", ancho: 20 },
    { titulo: "Total vendido", valor: (v) => v.totalVendido, tipo: "decimal", ancho: 18 },
  ],
  totalGeneral: [1, 2],
};

// ---------------------------------------------------------------------
// Iconos (trazo simple, heredan el color del contenedor)
// ---------------------------------------------------------------------
function Icono({ children }: { children: ReactNode }) {
  return (
    <span className="icono" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

// Lupa: búsqueda de artículos por nombre
const iconoBuscar = (
  <Icono>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icono>
);

// Caja de herramientas: artículos por categoría
const iconoCaja = (
  <Icono>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
    <path d="M10 11v4h4v-4" />
  </Icono>
);

// Factura con total
const iconoFactura = (
  <Icono>
    <path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Icono>
);

// Tablilla con lista: detalle de cada artículo vendido
const iconoDetalle = (
  <Icono>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1" />
    <path d="m8.5 10 1.5 1.5 3-3M8.5 16l1.5 1.5 3-3" />
    <path d="M15 11h1.5M15 17h1.5" />
  </Icono>
);

// Barras: ventas por categoría
const iconoVentas = (
  <Icono>
    <path d="M4 4v16h16" />
    <path d="M8 16v-5M12 16V8M16 16v-3" />
  </Icono>
);

// ---------------------------------------------------------------------
// Fila de la lista de reportes
// ---------------------------------------------------------------------
interface FilaProps {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  ocupado: boolean;
  onPdf: () => void;
  onExcel: () => void;
}

function FilaReporte({ icono, titulo, descripcion, ocupado, onPdf, onExcel }: FilaProps) {
  return (
    <li className="reporte">
      {icono}
      <div className="texto">
        <h2>{titulo}</h2>
        <p>{descripcion}</p>
      </div>
      <div className="acciones">
        <button type="button" className="boton primario" disabled={ocupado} onClick={onPdf}>
          Exportar a PDF
        </button>
        <button type="button" className="boton secundario" disabled={ocupado} onClick={onExcel}>
          Exportar a Excel
        </button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------
// Vista Reportes (ruta /reportes)
// ---------------------------------------------------------------------
export default function Reportes() {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // Obtiene los datos del back-end y los exporta al formato pedido
  async function exportar<T>(
    config: ConfigReporte<T>,
    obtener: () => Promise<T[]>,
    formato: Formato
  ) {
    try {
      setOcupado(true);
      const datos = await obtener();
      if (datos.length === 0) {
        alert("No hay datos para exportar con ese filtro.");
        return;
      }
      if (formato === "pdf") await exportarPDF(config, datos);
      else await exportarExcel(config, datos);
    } catch (error) {
      console.error(error);
      alert(
        `No se pudo generar el reporte. Verifique que el back-end esté corriendo en ${import.meta.env.VITE_API_URL}.`
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <header className="cabecera">
        <div className="cabecera-interior">
          <img src={logo} alt={`Logo de ${MARCA.nombre}`} width={64} height={64} />
          <div>
            <h1>{MARCA.nombre}</h1>
            <p>{MARCA.seccion}: exporta la información a PDF y Excel.</p>
          </div>
        </div>
        <div className="cinta" aria-hidden="true" />
      </header>

      <main className="pagina">
        <ul className="lista">
          <li className="reporte">
            {iconoBuscar}
            <div className="texto">
              <h2>Artículos por nombre</h2>
              <p>Busca los artículos activos cuyo nombre contenga un texto.</p>
            </div>
            <div className="acciones">
              <button
                type="button"
                className="boton primario"
                disabled={ocupado}
                onClick={() => dialogo.current?.showModal()}
              >
                Filtrar y exportar
              </button>
            </div>
          </li>

          <FilaReporte
            icono={iconoCaja}
            titulo="Artículos con su categoría"
            descripcion="Todos los artículos activos con su categoría, precio y stock."
            ocupado={ocupado}
            onPdf={() => exportar(configArticulosCategoria, reporteArticuloCategoria, "pdf")}
            onExcel={() => exportar(configArticulosCategoria, reporteArticuloCategoria, "excel")}
          />

          <FilaReporte
            icono={iconoFactura}
            titulo="Facturas por cliente"
            descripcion="Facturas activas con el cliente en una sola columna y el total."
            ocupado={ocupado}
            onPdf={() => exportar(configFacturasCliente, reporteClienteFactura, "pdf")}
            onExcel={() => exportar(configFacturasCliente, reporteClienteFactura, "excel")}
          />

          <FilaReporte
            icono={iconoDetalle}
            titulo="Detalle de facturas"
            descripcion="Cada artículo vendido en facturas activas, con el Total general al final."
            ocupado={ocupado}
            onPdf={() => exportar(configDetalleFacturas, reporteClienteFacturaDetalle, "pdf")}
            onExcel={() => exportar(configDetalleFacturas, reporteClienteFacturaDetalle, "excel")}
          />

          <FilaReporte
            icono={iconoVentas}
            titulo="Ventas por categoría"
            descripcion="Artículos vendidos y total por categoría, del mayor al menor, con Total general."
            ocupado={ocupado}
            onPdf={() => exportar(configVentasCategoria, reporteVentasCategoria, "pdf")}
            onExcel={() => exportar(configVentasCategoria, reporteVentasCategoria, "excel")}
          />
        </ul>

        <dialog ref={dialogo} className="dialogo">
          <h2>Artículos por nombre</h2>
          <label htmlFor="filtro-nombre">Nombre del artículo</label>
          <input
            id="filtro-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Por ejemplo: martillo"
          />
          <div className="acciones">
            <button
              type="button"
              className="boton primario"
              disabled={ocupado}
              onClick={() => exportar(configArticulosNombre, () => mostrarActivosFiltro(nombre.trim()), "pdf")}
            >
              Exportar a PDF
            </button>
            <button
              type="button"
              className="boton secundario"
              disabled={ocupado}
              onClick={() => exportar(configArticulosNombre, () => mostrarActivosFiltro(nombre.trim()), "excel")}
            >
              Exportar a Excel
            </button>
            <button type="button" className="boton texto" onClick={() => dialogo.current?.close()}>
              Cerrar
            </button>
          </div>
        </dialog>
      </main>
    </>
  );
}
