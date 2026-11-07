import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import logoUrl from "../assets/logo.png";
import { MARCA } from "../marca";

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------
export interface Columna<T> {
  titulo: string;
  valor: (d: T) => string | number;
  tipo?: "texto" | "entero" | "decimal";
  ancho?: number; // ancho de la columna en Excel
}

export interface ConfigReporte<T> {
  titulo: string;
  archivo: string; // nombre del archivo SIN extensión (distinto en cada reporte)
  columnas: Columna<T>[];
  // índices de las columnas numéricas que llevan fila final de "Total general"
  totalGeneral?: number[];
}

// ---------------------------------------------------------------------
// Colores (negro de taller + amarillo de cinta métrica)
// ---------------------------------------------------------------------
const NEGRO_PDF: [number, number, number] = [29, 29, 27];
const AMARILLO_PDF: [number, number, number] = [245, 184, 0];
const FILA_PDF: [number, number, number] = [255, 246, 214];
const GRIS_PDF: [number, number, number] = [107, 107, 102];
const NEGRO_EXCEL = "FF1D1D1B";
const AMARILLO_EXCEL = "FFF5B800";
const FILA_EXCEL = "FFFFF6D6";
const FORMATO_DECIMAL = "#,##0.00";

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
function fechaActual(): string {
  const f = new Date();
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

function formatear<T>(col: Columna<T>, valor: string | number): string {
  if (typeof valor === "number" && col.tipo === "decimal") {
    return valor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(valor);
}

function sumar<T>(cfg: ConfigReporte<T>, datos: T[], indice: number): number {
  return datos.reduce((suma, d) => suma + Number(cfg.columnas[indice].valor(d)), 0);
}

let logoCache: string | null = null;
async function cargarLogo(): Promise<string> {
  if (logoCache) return logoCache;
  const respuesta = await fetch(logoUrl);
  const blob = await respuesta.blob();
  logoCache = await new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(new Error("No se pudo leer el logo"));
    lector.readAsDataURL(blob);
  });
  return logoCache;
}

// ---------------------------------------------------------------------
// PDF (jsPDF + autoTable)
// ---------------------------------------------------------------------
export async function exportarPDF<T>(cfg: ConfigReporte<T>, datos: T[]): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();

  // Banda negra con logo, nombre de la ferretería, título y fecha
  const logo = await cargarLogo();
  doc.setFillColor(...NEGRO_PDF);
  doc.rect(0, 0, ancho, 30, "F");
  doc.addImage(logo, "PNG", 14, 6, 18, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(cfg.titulo, 38, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...AMARILLO_PDF);
  doc.text(MARCA.nombre, 38, 21);
  doc.setTextColor(205, 205, 200);
  doc.text(`Generado: ${fechaActual()}`, 38, 26);

  // Cinta métrica amarilla bajo la banda (marcas cada 2 mm, más largas cada 10 mm)
  doc.setFillColor(...AMARILLO_PDF);
  doc.rect(0, 30, ancho, 5, "F");
  doc.setDrawColor(...NEGRO_PDF);
  for (let x = 0, n = 0; x <= ancho; x += 2, n++) {
    const largo = n % 5 === 0 ? 3.5 : 1.8;
    doc.setLineWidth(n % 5 === 0 ? 0.35 : 0.2);
    doc.line(x, 30, x, 30 + largo);
  }
  doc.setTextColor(0, 0, 0);

  // Cuerpo de la tabla
  const body = datos.map((d) => cfg.columnas.map((c) => formatear(c, c.valor(d))));

  // Fila de pie con el Total general (foot de autoTable)
  let foot: string[] | undefined;
  if (cfg.totalGeneral && cfg.totalGeneral.length > 0) {
    const fila = cfg.columnas.map(() => "");
    const primera = Math.min(...cfg.totalGeneral);
    fila[Math.max(0, primera - 1)] = "Total general";
    cfg.totalGeneral.forEach((i) => {
      fila[i] = formatear(cfg.columnas[i], sumar(cfg, datos, i));
    });
    foot = fila;
  }

  // Números alineados a la derecha
  const estilos: Record<string, { halign: "right" }> = {};
  cfg.columnas.forEach((c, i) => {
    if (c.tipo === "entero" || c.tipo === "decimal") estilos[String(i)] = { halign: "right" };
  });

  autoTable(doc, {
    head: [cfg.columnas.map((c) => c.titulo)],
    body,
    foot: foot ? [foot] : undefined,
    startY: 42,
    theme: "grid",
    headStyles: { fillColor: NEGRO_PDF, textColor: AMARILLO_PDF, fontStyle: "bold" },
    footStyles: { fillColor: AMARILLO_PDF, textColor: NEGRO_PDF, fontStyle: "bold" },
    alternateRowStyles: { fillColor: FILA_PDF },
    columnStyles: estilos,
    styles: { lineColor: [201, 203, 205], lineWidth: 0.2 },
    margin: { top: 14, left: 14, right: 14, bottom: 14 },
  });

  // "Página i de n" centrado al pie, calculado con el tamaño real de la hoja
  const totalPaginas = doc.getNumberOfPages();
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_PDF);
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.text(`${MARCA.nombre}  |  Página ${i} de ${totalPaginas}`, ancho / 2, alto - 8, {
      align: "center",
    });
  }

  doc.save(`${cfg.archivo}.pdf`);
}

// ---------------------------------------------------------------------
// Excel (ExcelJS)
// ---------------------------------------------------------------------
export async function exportarExcel<T>(cfg: ConfigReporte<T>, datos: T[]): Promise<void> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Reporte", {
    properties: { tabColor: { argb: AMARILLO_EXCEL } },
  });

  const borde: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Ancho de columnas
  cfg.columnas.forEach((c, j) => {
    hoja.getColumn(j + 1).width = c.ancho ?? 20;
  });

  // Fila 1: título, fila 2: fecha, fila 3: vacía
  const titulo = hoja.addRow([cfg.titulo]);
  titulo.font = { bold: true, size: 16, color: { argb: NEGRO_EXCEL } };
  titulo.height = 30;
  const subtitulo = hoja.addRow([`${MARCA.nombre}  |  Generado: ${fechaActual()}`]);
  subtitulo.font = { color: { argb: "FF6B6B66" } };
  subtitulo.height = 18;
  hoja.addRow([]).height = 18;

  // Logo en la esquina superior derecha de la tabla (no mueve ninguna fila)
  const imagen = libro.addImage({ base64: await cargarLogo(), extension: "png" });
  const anchoUltima = (cfg.columnas[cfg.columnas.length - 1].ancho ?? 20) * 7 + 5; // px aprox.
  hoja.addImage(imagen, {
    tl: { col: cfg.columnas.length - 1 + Math.max(0, (anchoUltima - 60) / anchoUltima), row: 0.05 },
    ext: { width: 56, height: 56 },
  });

  // Fila 4: encabezado con color, letra blanca en negrita y bordes
  const encabezado = hoja.addRow(cfg.columnas.map((c) => c.titulo));
  cfg.columnas.forEach((_, j) => {
    const celda = encabezado.getCell(j + 1);
    celda.font = { bold: true, color: { argb: AMARILLO_EXCEL } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NEGRO_EXCEL } };
    celda.border = borde;
    celda.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Datos desde la fila 5, con filas alternas, bordes y formato numérico
  datos.forEach((d, i) => {
    const fila = hoja.addRow(cfg.columnas.map((c) => c.valor(d)));
    cfg.columnas.forEach((c, j) => {
      const celda = fila.getCell(j + 1);
      celda.border = borde;
      if (c.tipo === "decimal") celda.numFmt = FORMATO_DECIMAL;
      if (c.tipo === "entero") celda.numFmt = "0";
      if (i % 2 === 1) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILA_EXCEL } };
      }
    });
  });

  // Fila final de Total general con fórmula SUM
  if (cfg.totalGeneral && cfg.totalGeneral.length > 0) {
    const ultima = 4 + datos.length; // última fila de datos (empiezan en la fila 5)
    const fila = hoja.addRow(cfg.columnas.map(() => ""));
    const primera = Math.min(...cfg.totalGeneral);
    fila.getCell(Math.max(0, primera - 1) + 1).value = "Total general";
    cfg.totalGeneral.forEach((i) => {
      const letra = hoja.getColumn(i + 1).letter;
      const celda = fila.getCell(i + 1);
      celda.value = {
        formula: `SUM(${letra}5:${letra}${ultima})`,
        result: Math.round(sumar(cfg, datos, i) * 100) / 100,
      };
      celda.numFmt = cfg.columnas[i].tipo === "decimal" ? FORMATO_DECIMAL : "0";
    });
    cfg.columnas.forEach((_, j) => {
      const celda = fila.getCell(j + 1);
      celda.font = { bold: true, color: { argb: NEGRO_EXCEL } };
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMARILLO_EXCEL } };
      celda.border = borde;
    });
  }

  // Descarga: libro -> writeBuffer -> Blob -> enlace
  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${cfg.archivo}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}
