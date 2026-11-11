const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ¿El usuario ya está en la cola de ese libro? (evita duplicados).
function reservaExistente(usuarioId, libroId) {
  return prisma.reserva.findFirst({ where: { usuarioId, libroId } });
}

// Cuántos están en la cola del libro (para calcular la posición FIFO).
function contarReservasDeLibro(libroId) {
  return prisma.reserva.count({ where: { libroId } });
}

// Crea la reserva en la posición indicada (HU-18).
function crearReserva({ usuarioId, libroId, posicion }) {
  return prisma.reserva.create({ data: { usuarioId, libroId, posicion } });
}

// Reservas del usuario, con el libro, ordenadas por antigüedad (HU-18/19).
function reservasDeUsuario(usuarioId) {
  return prisma.reserva.findMany({
    where: { usuarioId },
    include: { libro: { select: { titulo: true, autor: true } } },
    orderBy: { fechaSolicitud: 'asc' },
  });
}

module.exports = { reservaExistente, contarReservasDeLibro, crearReserva, reservasDeUsuario };
