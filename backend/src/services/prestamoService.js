const prestamoRepository = require('../repositories/prestamoRepository');

// Reglas de negocio del préstamo (documento maestro + criterios HU-11).
const PLAZO_DIAS = 14;              // vencimiento a 14 días
const MAX_PRESTAMOS_ACTIVOS = 3;    // máximo de préstamos activos por usuario
const TARIFA_MULTA_DIARIA = 1000;   // COP por día de atraso (CONFIRMAR con el equipo)
const UMBRAL_POR_VENCER = 3;        // días para marcar un préstamo "por vencer"

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

/**
 * Renovar préstamo (HU-13).
 * Solo si es del usuario, está ACTIVO, no vencido, sin multa, sin renovación
 * previa y sin cola de espera; extiende el vencimiento 14 días más.
 */
async function renovarPrestamo({ prestamoId, usuarioId }) {
  const prestamo = await prestamoRepository.buscarPrestamoPorId(prestamoId);
  if (!prestamo || prestamo.usuarioId !== usuarioId) {
    throw new ReglaNegocioError('Préstamo no encontrado.', 404);
  }
  if (prestamo.estado !== 'ACTIVO') {
    throw new ReglaNegocioError('Solo se pueden renovar préstamos activos.');
  }
  // Esc. 2: vencido.
  if (new Date(prestamo.fechaVencimiento).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
    throw new ReglaNegocioError('El préstamo está vencido. Debes devolver el libro y pagar la multa si aplica.');
  }
  // Sin multa pendiente.
  if (await prestamoRepository.tieneMultaPendiente(usuarioId)) {
    throw new ReglaNegocioError('Tienes una multa pendiente. Consulta el valor para continuar.');
  }
  // Esc. 3: solo una renovación.
  if (prestamo.renovaciones >= 1) {
    throw new ReglaNegocioError('Este préstamo solo se puede renovar una vez.');
  }
  // Esc. 4: no renovar si otro usuario espera el libro.
  if (await prestamoRepository.primeraReservaDelLibro(prestamo.ejemplar.libroId)) {
    throw new ReglaNegocioError('No se puede renovar: hay reservas pendientes de este libro.');
  }
  const nuevaFecha = sumarDias(prestamo.fechaVencimiento, PLAZO_DIAS);
  return prestamoRepository.renovarPrestamo({ prestamoId, nuevaFecha });
}

/**
 * Historial de préstamos del usuario (HU-14).
 * Clasifica cada préstamo (ACTIVO / VENCIDO / DEVUELTO), calcula los días
 * restantes, marca los que están por vencer y expone la multa si la hay.
 */
async function obtenerHistorial(usuarioId) {
  const prestamos = await prestamoRepository.buscarPrestamosPorUsuario(usuarioId);
  const hoy = new Date().setHours(0, 0, 0, 0);

  return prestamos.map((p) => {
    const venc = new Date(p.fechaVencimiento).setHours(0, 0, 0, 0);
    let estado;
    if (p.estado === 'DEVUELTO') estado = 'DEVUELTO';
    else estado = venc < hoy ? 'VENCIDO' : 'ACTIVO';

    const diasRestantes = estado === 'DEVUELTO' ? null : Math.round((venc - hoy) / 86400000);
    const porVencer = estado === 'ACTIVO' && diasRestantes <= UMBRAL_POR_VENCER;

    return {
      id: p.id,
      libro: { titulo: p.ejemplar.libro.titulo, autor: p.ejemplar.libro.autor },
      fechaPrestamo: p.fechaPrestamo,
      fechaVencimiento: p.fechaVencimiento,
      fechaDevolucion: p.fechaDevolucion,
      estado,
      diasRestantes,
      porVencer,
      multa: p.multa ? { monto: p.multa.monto, pagada: p.multa.pagada } : null,
    };
  });
}

module.exports = {
  solicitarPrestamo,
  devolverPrestamo,
  renovarPrestamo,
  obtenerHistorial,
  ReglaNegocioError,
  PLAZO_DIAS,
  MAX_PRESTAMOS_ACTIVOS,
  TARIFA_MULTA_DIARIA,
};
