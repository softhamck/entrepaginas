const prestamoRepository = require('../repositories/prestamoRepository');

// Reglas de negocio del préstamo (documento maestro + criterios HU-11).
const PLAZO_DIAS = 14;              // vencimiento a 14 días
const MAX_PRESTAMOS_ACTIVOS = 3;    // máximo de préstamos activos por usuario
const TARIFA_MULTA_DIARIA = 1000;   // COP por día de atraso (CONFIRMAR con el equipo)

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

// Días de atraso entre vencimiento y devolución (0 si se devuelve a tiempo).
function diasDeAtraso(fechaVencimiento, fechaDevolucion) {
  const venc = new Date(fechaVencimiento).setHours(0, 0, 0, 0);
  const dev = new Date(fechaDevolucion).setHours(0, 0, 0, 0);
  const dias = Math.round((dev - venc) / 86400000);
  return dias > 0 ? dias : 0;
}

/**
 * Registrar devolución (HU-12).
 * Cierra el préstamo, libera el ejemplar y, si hubo atraso, genera la multa.
 * Indica si queda alguien en la cola de espera del libro.
 */
async function devolverPrestamo({ prestamoId }) {
  const prestamo = await prestamoRepository.buscarPrestamoPorId(prestamoId);
  if (!prestamo || prestamo.estado === 'DEVUELTO') {
    throw new ReglaNegocioError('No hay un préstamo activo para registrar la devolución.', 404);
  }

  const fechaDevolucion = new Date();
  const atraso = diasDeAtraso(prestamo.fechaVencimiento, fechaDevolucion);
  const multa = atraso > 0 ? { monto: atraso * TARIFA_MULTA_DIARIA } : null;

  const actualizado = await prestamoRepository.registrarDevolucion({
    prestamoId,
    ejemplarId: prestamo.ejemplarId,
    fechaDevolucion,
    multa,
  });

  // Esc. 3: si el libro tiene cola, queda un primero a notificar (aviso: HU-20/21).
  const siguienteEnCola = await prestamoRepository.primeraReservaDelLibro(prestamo.ejemplar.libroId);

  return { ...actualizado, diasAtraso: atraso, multa, siguienteEnCola: siguienteEnCola || null };
}

module.exports = {
  solicitarPrestamo,
  devolverPrestamo,
  ReglaNegocioError,
  PLAZO_DIAS,
  MAX_PRESTAMOS_ACTIVOS,
  TARIFA_MULTA_DIARIA,
};
