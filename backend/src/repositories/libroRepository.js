const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buscarLibroPorTituloAutor(titulo, autor) {
  return prisma.libro.findFirst({ where: { titulo, autor } });
}

function crearLibro({ titulo, autor, signatura, categoria, descripcion }) {
  return prisma.libro.create({ data: { titulo, autor, signatura, categoria, descripcion } });
}

function buscarEjemplarPorCodigo(codigo) {
  return prisma.ejemplar.findUnique({ where: { codigo } });
}

function crearEjemplar({ libroId, codigo, costo }) {
  return prisma.ejemplar.create({ data: { libroId, codigo, costo } });
}

// Búsqueda y filtros del catálogo (HU-08).
function buscarLibros({ q, categoria, soloDisponibles } = {}) {
  const condiciones = [];
  if (q) {
    condiciones.push({
      OR: [
        { titulo: { contains: q, mode: 'insensitive' } },
        { autor: { contains: q, mode: 'insensitive' } },
        { signatura: { contains: q, mode: 'insensitive' } },
        { ejemplares: { some: { codigo: { contains: q, mode: 'insensitive' } } } },
      ],
    });
  }
  if (categoria) condiciones.push({ categoria: { equals: categoria, mode: 'insensitive' } });
  if (soloDisponibles) condiciones.push({ ejemplares: { some: { estado: 'DISPONIBLE' } } });

  return prisma.libro.findMany({
    where: condiciones.length ? { AND: condiciones } : {},
    include: { ejemplares: true },
    orderBy: { titulo: 'asc' },
  });
}

// Detalle de un libro por id, con sus ejemplares (HU-09).
function buscarLibroPorId(id) {
  return prisma.libro.findUnique({ where: { id }, include: { ejemplares: true } });
}

// Actualiza los datos de un libro (HU-10 editar).
function actualizarLibro(id, datos) {
  return prisma.libro.update({ where: { id }, data: datos });
}

// Un ejemplar por id (para dar de baja, HU-10).
function buscarEjemplarPorId(id) {
  return prisma.ejemplar.findUnique({ where: { id } });
}

// Cuántos préstamos (historial) tiene el ejemplar: decide baja lógica vs borrado.
function contarPrestamosDeEjemplar(ejemplarId) {
  return prisma.prestamo.count({ where: { ejemplarId } });
}

// Baja lógica: el ejemplar deja de circular pero se conserva (estado BAJA).
function darDeBajaEjemplar(id) {
  return prisma.ejemplar.update({ where: { id }, data: { estado: 'BAJA' } });
}

// Eliminación física: solo para ejemplares sin historial de préstamos.
function eliminarEjemplar(id) {
  return prisma.ejemplar.delete({ where: { id } });
}

module.exports = {
  buscarLibroPorTituloAutor,
  crearLibro,
  buscarEjemplarPorCodigo,
  crearEjemplar,
  buscarLibros,
  buscarLibroPorId,
  actualizarLibro,
  buscarEjemplarPorId,
  contarPrestamosDeEjemplar,
  darDeBajaEjemplar,
  eliminarEjemplar,
};
