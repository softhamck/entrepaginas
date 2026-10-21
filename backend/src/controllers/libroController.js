const XLSX = require('xlsx');
const { importarInventario, listarCatalogo } = require('../services/libroService');

const EXTENSIONES_VALIDAS = ['.xlsx', '.csv'];

async function importar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Debes adjuntar un archivo (campo "archivo")' });
  }
  const nombre = (req.file.originalname || '').toLowerCase();
  const extensionValida = EXTENSIONES_VALIDAS.some((ext) => nombre.endsWith(ext));
  if (!extensionValida) {
    return res.status(400).json({ error: 'Formato no válido. Solo se admiten archivos Excel (.xlsx) o CSV.' });
  }
  try {
    const libro = XLSX.read(req.file.buffer, { type: 'buffer' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });
    if (filas.length === 0) {
      return res.status(400).json({ error: 'El archivo no tiene filas para importar' });
    }
    const reporte = await importarInventario(filas, { duplicados: req.body.duplicados });
    return res.status(201).json(reporte);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo procesar el archivo' });
  }
}

// Catálogo (HU-08): GET /api/libros?q=...&categoria=...&disponibles=true
async function listar(req, res) {
  try {
    const { q, categoria, disponibles } = req.query;
    const soloDisponibles = disponibles === 'true' || disponibles === '1';
    const catalogo = await listarCatalogo({ q, categoria, soloDisponibles });
    return res.json(catalogo);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo consultar el catálogo' });
  }
}

module.exports = { importar, listar };
