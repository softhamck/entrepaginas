const prestamoRepository = require('../repositories/prestamoRepository');

// Reglas de negocio del préstamo (documento maestro + criterios HU-11).
const PLAZO_DIAS = 14;              // vencimiento a 14 días
const MAX_PRESTAMOS_ACTIVOS = 3;    // máximo de préstamos activos por usuario

// Error de regla de negocio: lleva el código HTTP que debe devolver el controlador.
class ReglaNegocioError extends Error {
  constructor(mensaje, codigo = 409) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function sumarDias(fecha, dias) {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

/**
 * Solicitar préstamo (HU-11).
 * Valida existencia del libro, multa pendiente, límite y disponibilidad;
 * si todo pasa, registra el préstamo con vencimiento a 14 días.
 */
async function solicitarPrestamo({ usuarioId, libroId }) {
  const libro = await prestamoRepository.buscarLibroPorId(libroId);
  if (!libro) throw new ReglaNegocioError('Libro no encontrado', 404);

  // Esc. 4 / HU-17: usuario con multa pendiente no puede prestar.
  if (await prestamoRepository.tieneMultaPendiente(usuarioId)) {
    throw new ReglaNegocioError('Tienes una multa pendiente. Consulta el valor para continuar.');
  }

  // Esc. 3: límite de préstamos activos.
  const activos = await prestamoRepository.contarPrestamosActivos(usuarioId);
  if (activos >= MAX_PRESTAMOS_ACTIVOS) {
    throw new ReglaNegocioError(`Alcanzaste el máximo de ${MAX_PRESTAMOS_ACTIVOS} préstamos activos.`);
  }

  // Esc. 2: debe haber un ejemplar disponible.
  const ejemplar = await prestamoRepository.buscarEjemplarDisponiblePorLibro(libroId);
  if (!ejemplar) {
    throw new ReglaNegocioError('No hay ejemplares disponibles. Puedes unirte a la cola de espera.');
  }

  // Esc. 1: registrar el préstamo y tomar el ejemplar.
  const fechaVencimiento = sumarDias(new Date(), PLAZO_DIAS);
  return prestamoRepository.crearPrestamo({ usuarioId, ejemplarId: ejemplar.id, fechaVencimiento });
}

module.exports = { solicitarPrestamo, ReglaNegocioError, PLAZO_DIAS, MAX_PRESTAMOS_ACTIVOS };
