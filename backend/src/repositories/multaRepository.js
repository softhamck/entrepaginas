const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Todas las multas, con el usuario y el libro asociados (HU-15 listado).
function listarMultas() {
  return prisma.multa.findMany({
    include: {
      prestamo: {
        include: {
          usuario: { select: { id: true, nombre: true, correo: true } },
          ejemplar: { include: { libro: { select: { titulo: true } } } },
        },
      },
    },
    orderBy: { id: 'desc' },
  });
}

// Una multa por id, con el usuario dueño (para registrar el pago).
function buscarMultaPorId(id) {
  return prisma.multa.findUnique({
    where: { id },
    include: { prestamo: { select: { usuarioId: true } } },
  });
}

// Marca la multa como pagada (HU-15 esc. 3).
function marcarPagada(id) {
  return prisma.multa.update({ where: { id }, data: { pagada: true } });
}

// Cuántas multas pendientes tiene un usuario (para el estado de bloqueo, HU-17).
function contarPendientesPorUsuario(usuarioId) {
  return prisma.multa.count({ where: { pagada: false, prestamo: { usuarioId } } });
}

module.exports = { listarMultas, buscarMultaPorId, marcarPagada, contarPendientesPorUsuario };
