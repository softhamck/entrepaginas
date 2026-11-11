const reservaRepository = require('../repositories/reservaRepository');
const prestamoRepository = require('../repositories/prestamoRepository');
const { ReglaNegocioError } = require('./prestamoService');

/**
 * Unirse a la cola de espera de un libro (HU-18).
 * Solo si el libro existe, el usuario no tiene multas, no hay ejemplares
 * disponibles (si los hay, debe pedir préstamo) y no está ya en la cola.
 */
async function crearReserva({ usuarioId, libroId }) {
  const libro = await prestamoRepository.buscarLibroPorId(libroId);
  if (!libro) throw new ReglaNegocioError('Libro no encontrado.', 404);

  // Esc. 4 / HU-17: bloqueo por multa pendiente.
  if (await prestamoRepository.tieneMultaPendiente(usuarioId)) {
    throw new ReglaNegocioError('Tienes una multa pendiente. Consulta el valor para continuar.');
  }
  // Si hay disponibilidad, no se reserva: se presta.
  if (await prestamoRepository.buscarEjemplarDisponiblePorLibro(libroId)) {
    throw new ReglaNegocioError('Este libro tiene ejemplares disponibles. Puedes solicitar el préstamo.');
  }
  // No duplicar en la cola.
  if (await reservaRepository.reservaExistente(usuarioId, libroId)) {
    throw new ReglaNegocioError('Ya estás en la cola de espera de este libro.');
  }

  const enCola = await reservaRepository.contarReservasDeLibro(libroId);
  const posicion = enCola + 1; // FIFO: al final de la cola
  const reserva = await reservaRepository.crearReserva({ usuarioId, libroId, posicion });
  return { id: reserva.id, libroId, posicion };
}

// Reservas del usuario con su posición (HU-18 esc. 2 / HU-19).
async function misReservas(usuarioId) {
  const reservas = await reservaRepository.reservasDeUsuario(usuarioId);
  return reservas.map((r) => ({
    id: r.id,
    libro: { titulo: r.libro.titulo, autor: r.libro.autor },
    posicion: r.posicion,
    fechaSolicitud: r.fechaSolicitud,
  }));
}

module.exports = { crearReserva, misReservas };
