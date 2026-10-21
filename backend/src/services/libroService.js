const libroRepository = require('../repositories/libroRepository');

// Quita acentos, pasa a minúscula y recorta: sirve para reconocer los
// encabezados del archivo sin importar mayúsculas o tildes.
function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase();
}

const COLUMNAS = {
  titulo: 'titulo',
  signatura: 'signatura',
  codigo: 'codigo',
  costo: 'costo',
  autor: 'autor',
  descripcion: 'descripcion',
  categoria: 'categoria',
};

function mapearFila(filaCruda) {
  const fila = {};
  for (const clave of Object.keys(filaCruda)) {
    const campo = COLUMNAS[normalizar(clave)];
    if (campo) fila[campo] = filaCruda[clave];
  }
  return fila;
}

// "$ 50.000" -> 50000 ; 50000 -> 50000 ; vacío -> null
function parsearCosto(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const soloDigitos = String(valor).replace(/[^\d]/g, '');
  return soloDigitos ? parseInt(soloDigitos, 10) : null;
}

/**
 * Importa el inventario (HU-06).
 * @param {Array<Object>} filasCrudas  filas tal como vienen del Excel/CSV
 * @param {Object} opciones  { duplicados: 'sumar' | 'omitir' }  (para libros ya existentes)
 */
async function importarInventario(filasCrudas, opciones = {}) {
  const modoLibroExistente = opciones.duplicados === 'omitir' ? 'omitir' : 'sumar';

  const reporte = { agregados: 0, librosNuevos: 0, omitidos: [], total: filasCrudas.length };
  const codigosVistos = new Set();
  const cacheLibros = new Map();

  for (let i = 0; i < filasCrudas.length; i++) {
    const numeroFila = i + 2;
    const fila = mapearFila(filasCrudas[i]);
    const titulo = String(fila.titulo ?? '').trim();
    const autor = String(fila.autor ?? '').trim();
    const codigo = String(fila.codigo ?? '').trim();

    if (!titulo || !codigo) {
      reporte.omitidos.push({ fila: numeroFila, motivo: 'Título o Código vacío' });
      continue;
    }

    const yaEnArchivo = codigosVistos.has(codigo);
    const yaEnBase = yaEnArchivo ? true : Boolean(await libroRepository.buscarEjemplarPorCodigo(codigo));
    if (yaEnArchivo || yaEnBase) {
      reporte.omitidos.push({ fila: numeroFila, codigo, motivo: 'Código ya registrado' });
      continue;
    }
    codigosVistos.add(codigo);

    const clave = `${titulo}||${autor}`;
    let libroId = cacheLibros.get(clave);
    let libroYaExistia = false;

    if (libroId === undefined) {
      const existente = await libroRepository.buscarLibroPorTituloAutor(titulo, autor);
      if (existente) {
        libroId = existente.id;
        libroYaExistia = true;
      } else {
        const creado = await libroRepository.crearLibro({
          titulo, autor,
          signatura: fila.signatura ? String(fila.signatura).trim() : null,
          categoria: fila.categoria ? String(fila.categoria).trim() : null,
          descripcion: fila.descripcion ? String(fila.descripcion).trim() : null,
        });
        libroId = creado.id;
        reporte.librosNuevos += 1;
      }
      cacheLibros.set(clave, libroId);
    }

    if (libroYaExistia && modoLibroExistente === 'omitir') {
      reporte.omitidos.push({ fila: numeroFila, codigo, motivo: 'El libro ya existía y se conservó como estaba' });
      continue;
    }

    await libroRepository.crearEjemplar({ libroId, codigo, costo: parsearCosto(fila.costo) });
    reporte.agregados += 1;
  }

  return reporte;
}

/**
 * Catálogo (HU-08): búsqueda, filtros y disponibilidad.
 * Devuelve la lista de libros con su disponibilidad. NO expone el costo
 * (es información interna del administrador).
 */
async function listarCatalogo({ q, categoria, soloDisponibles } = {}) {
  const libros = await libroRepository.buscarLibros({ q, categoria, soloDisponibles });
  return libros.map((libro) => {
    const ejemplares = libro.ejemplares ?? [];
    const disponibles = ejemplares.filter((e) => e.estado === 'DISPONIBLE').length;
    return {
      id: libro.id,
      titulo: libro.titulo,
      autor: libro.autor,
      signatura: libro.signatura,
      categoria: libro.categoria,
      descripcion: libro.descripcion,
      ejemplares: ejemplares.length,
      disponibles,
      disponible: disponibles > 0,
    };
  });
}

// Detalle (HU-09): devuelve null si el libro no existe. No expone el costo.
async function obtenerDetalle(id) {
  const libro = await libroRepository.buscarLibroPorId(id);
  if (!libro) return null;
  const ejemplares = libro.ejemplares ?? [];
  const disponibles = ejemplares.filter((e) => e.estado === 'DISPONIBLE').length;
  return {
    id: libro.id,
    titulo: libro.titulo,
    autor: libro.autor,
    signatura: libro.signatura,
    categoria: libro.categoria,
    descripcion: libro.descripcion,
    ejemplares: ejemplares.length,
    disponibles,
    disponible: disponibles > 0,
  };
}

module.exports = { importarInventario, parsearCosto, mapearFila, listarCatalogo, obtenerDetalle };
