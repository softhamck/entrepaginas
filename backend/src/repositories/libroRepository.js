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

module.exports = {
  buscarLibroPorTituloAutor,
  crearLibro,
  buscarEjemplarPorCodigo,
  crearEjemplar,
  buscarLibros,
  buscarLibroPorId,
};
