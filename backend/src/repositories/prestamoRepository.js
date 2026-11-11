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

// Préstamo por id, con su ejemplar (para devolución HU-12).
function buscarPrestamoPorId(id) {
  return prisma.prestamo.findUnique({ where: { id }, include: { ejemplar: true } });
}

// Registra la devolución en una transacción: cierra el préstamo, libera el
// ejemplar y, si hubo atraso, crea la multa (HU-12 + HU-15).
function registrarDevolucion({ prestamoId, ejemplarId, fechaDevolucion, multa }) {
  return prisma.$transaction(async (tx) => {
    const prestamo = await tx.prestamo.update({
      where: { id: prestamoId },
      data: { estado: 'DEVUELTO', fechaDevolucion },
    });
    await tx.ejemplar.update({ where: { id: ejemplarId }, data: { estado: 'DISPONIBLE' } });
    if (multa) {
      await tx.multa.create({ data: { prestamoId, monto: multa.monto } });
    }
    return prestamo;
  });
}

// Primera reserva (menor posición) del libro; null si no hay cola (HU-12 esc. 3).
function primeraReservaDelLibro(libroId) {
  return prisma.reserva.findFirst({ where: { libroId }, orderBy: { posicion: 'asc' } });
}

// Renueva el préstamo: nueva fecha de vencimiento y suma 1 a renovaciones (HU-13).
function renovarPrestamo({ prestamoId, nuevaFecha }) {
  return prisma.prestamo.update({
    where: { id: prestamoId },
    data: { fechaVencimiento: nuevaFecha, renovaciones: { increment: 1 } },
  });
}

module.exports = {
  buscarLibroPorId,
  buscarEjemplarDisponiblePorLibro,
  contarPrestamosActivos,
  tieneMultaPendiente,
  crearPrestamo,
  buscarPrestamoPorId,
  registrarDevolucion,
  primeraReservaDelLibro,
  renovarPrestamo,
};
