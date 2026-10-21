const libroRepository = require('../repositories/libroRepository');

// Quita acentos, pasa a minúscula y recorta: sirve para reconocer los
// encabezados del archivo sin importar mayúsculas o tildes.
function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase();
}

// Mapa de encabezado del archivo -> campo interno. Las columnas de préstamo
// (biblioteca, cédula, nombre, correo, meses...) no están aquí y se ignoran.
const COLUMNAS = {
  titulo: 'titulo',
  signatura: 'signatura',
  codigo: 'codigo',
  costo: 'costo',
  autor: 'autor',
  descripcion: 'descripcion',
  categoria: 'categoria',
};

// Convierte una fila cruda del Excel en un objeto con nuestros campos.
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
 * Importa el inventario.
 * @param {Array<Object>} filasCrudas  filas tal como vienen del Excel/CSV
 * @param {Object} opciones  { duplicados: 'sumar' | 'omitir' }  (para libros ya existentes)
 * @returns {Object} reporte de la carga
 */
async function importarInventario(filasCrudas, opciones = {}) {
  const modoLibroExistente = opciones.duplicados === 'omitir' ? 'omitir' : 'sumar';

  const reporte = { agregados: 0, librosNuevos: 0, omitidos: [], total: filasCrudas.length };
  const codigosVistos = new Set(); // detecta duplicados dentro del mismo archivo
  const cacheLibros = new Map();   // "titulo||autor" -> libroId (creados en esta carga)

  for (let i = 0; i < filasCrudas.length; i++) {
    const numeroFila = i + 2; // +2: fila 1 es el encabezado
    const fila = mapearFila(filasCrudas[i]);
    const titulo = String(fila.titulo ?? '').trim();
    const autor = String(fila.autor ?? '').trim();
    const codigo = String(fila.codigo ?? '').trim();

    // Validación: Título y Código son obligatorios.
    if (!titulo || !codigo) {
      reporte.omitidos.push({ fila: numeroFila, motivo: 'Título o Código vacío' });
      continue;
    }

    // Código duplicado (en el archivo o ya en la base): no se duplica.
    const yaEnArchivo = codigosVistos.has(codigo);
    const yaEnBase = yaEnArchivo ? true : Boolean(await libroRepository.buscarEjemplarPorCodigo(codigo));
    if (yaEnArchivo || yaEnBase) {
      reporte.omitidos.push({ fila: numeroFila, codigo, motivo: 'Código ya registrado' });
      continue;
    }
    codigosVistos.add(codigo);

    // Ubica o crea el libro (agrupando por Título + Autor).
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

    // Si el libro ya existía y el admin eligió "omitir", no se agrega el ejemplar.
    if (libroYaExistia && modoLibroExistente === 'omitir') {
      reporte.omitidos.push({ fila: numeroFila, codigo, motivo: 'El libro ya existía y se conservó como estaba' });
      continue;
    }

    await libroRepository.crearEjemplar({ libroId, codigo, costo: parsearCosto(fila.costo) });
    reporte.agregados += 1;
  }

  return reporte;
}

module.exports = { importarInventario, parsearCosto, mapearFila };
