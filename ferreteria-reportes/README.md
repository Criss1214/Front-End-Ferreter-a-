# Reportes de ferretería (React + TypeScript)

Vista `/reportes` que consume el back-end `finalb` y exporta a PDF (jsPDF + jspdf-autotable) y Excel (ExcelJS).

## Cómo correrlo
1. Back-end `finalb` corriendo en http://localhost:8080 (base `finalB` ya creada en MySQL).
2. `npm install`
3. `npm run dev` y abrir http://localhost:5173/reportes

La URL del back-end está en `.env` (`VITE_API_URL`).

## Estructura
- `src/types/` una interfaz por cada DTO
- `src/services/` llamadas a la API con `api.get<Tipo[]>(...)`
- `src/utils/exportar.ts` funciones `exportarPDF` y `exportarExcel`
- `src/pages/Reportes.tsx` botones, `<dialog>` del filtro y configuración de cada reporte

## Identidad visual
- Logo (martillo y llave cruzados): `src/assets/logo.png` (se usa en la página y en los PDF/Excel) y `public/favicon.svg`. El original editable está en `src/assets/logo.svg`.
- Nombre de la ferretería y colores: `src/marca.ts` (cambia `MARCA.nombre` para poner el nombre real del negocio; también hay que ajustar los colores de `src/index.css` y `src/utils/exportar.ts` si se cambia la paleta).
- Paleta: negro de taller `#1D1D1B` y amarillo de cinta métrica `#F5B800`.
