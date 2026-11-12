const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Préstamos del usuario con la categoría del libro (para inferir géneros).
function prestamosConCategoria(usuarioId) {
  return prisma.prestamo.findMany({
    where: { usuarioId },
    include: { ejemplar: { include: { libro: { select: { id: true, categoria: true } } } } },
  });
}

// Libros del catálogo de ciertas categorías, excluyendo los ya leídos (SC-001 anti-alucinación).
function librosRecomendables({ categorias, excluirLibroIds, limite }) {
  return prisma.libro.findMany({
    where: {
      categoria: { in: categorias },
      id: { notIn: excluirLibroIds },
    },
    take: limite,
    orderBy: { titulo: 'asc' },
  });
}

module.exports = { prestamosConCategoria, librosRecomendables };
