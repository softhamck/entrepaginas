const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Un libro se identifica por su título + autor (puede tener varios ejemplares).
function buscarLibroPorTituloAutor(titulo, autor) {
  return prisma.libro.findFirst({ where: { titulo, autor } });
}

function crearLibro({ titulo, autor, signatura, categoria, descripcion }) {
  return prisma.libro.create({ data: { titulo, autor, signatura, categoria, descripcion } });
}

// El código es único por ejemplar (es la llave real del inventario de Comfama).
function buscarEjemplarPorCodigo(codigo) {
  return prisma.ejemplar.findUnique({ where: { codigo } });
}

function crearEjemplar({ libroId, codigo, costo }) {
  return prisma.ejemplar.create({ data: { libroId, codigo, costo } });
}

module.exports = {
  buscarLibroPorTituloAutor,
  crearLibro,
  buscarEjemplarPorCodigo,
  crearEjemplar,
};
