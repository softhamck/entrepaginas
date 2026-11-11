const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Datos mínimos del libro para validar que existe (HU-11).
function buscarLibroPorId(id) {
  return prisma.libro.findUnique({ where: { id } });
}

// Un ejemplar DISPONIBLE del libro; null si no hay (HU-11 esc. 2).
function buscarEjemplarDisponiblePorLibro(libroId) {
  return prisma.ejemplar.findFirst({ where: { libroId, estado: 'DISPONIBLE' } });
}

// Número de préstamos ACTIVOS del usuario, para el límite (HU-11 esc. 3).
function contarPrestamosActivos(usuarioId) {
  return prisma.prestamo.count({ where: { usuarioId, estado: 'ACTIVO' } });
}

// ¿El usuario tiene alguna multa sin pagar? Bloqueo (HU-11 esc. 4 / HU-17).
function tieneMultaPendiente(usuarioId) {
  return prisma.multa.findFirst({ where: { pagada: false, prestamo: { usuarioId } } });
}

// Registra el préstamo y marca el ejemplar como PRESTADO en una sola transacción.
function crearPrestamo({ usuarioId, ejemplarId, fechaVencimiento }) {
  return prisma.$transaction(async (tx) => {
    const prestamo = await tx.prestamo.create({
      data: { usuarioId, ejemplarId, fechaVencimiento },
    });
    await tx.ejemplar.update({ where: { id: ejemplarId }, data: { estado: 'PRESTADO' } });
    return prestamo;
  });
}

module.exports = {
  buscarLibroPorId,
  buscarEjemplarDisponiblePorLibro,
  contarPrestamosActivos,
  tieneMultaPendiente,
  crearPrestamo,
};
