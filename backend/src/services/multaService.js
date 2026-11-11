const multaRepository = require('../repositories/multaRepository');
const prestamoRepository = require('../repositories/prestamoRepository');
const { ReglaNegocioError } = require('./prestamoService');

// Listado de multas para el administrador (HU-15 esc. 2).
async function listarMultas() {
  const multas = await multaRepository.listarMultas();
  return multas.map((m) => ({
    id: m.id,
    usuario: { id: m.prestamo.usuario.id, nombre: m.prestamo.usuario.nombre },
    libro: { titulo: m.prestamo.ejemplar.libro.titulo },
    monto: m.monto,
    pagada: m.pagada,
  }));
}

/**
 * Registrar el pago de una multa (HU-15 esc. 3).
 * Al pagar, si el usuario no tiene otras multas pendientes, se levanta su bloqueo.
 */
async function pagarMulta(id) {
  const multa = await multaRepository.buscarMultaPorId(id);
  if (!multa) throw new ReglaNegocioError('Multa no encontrada.', 404);
  if (multa.pagada) throw new ReglaNegocioError('La multa ya está pagada.');

  await multaRepository.marcarPagada(id);

  // ¿Le quedan otras multas pendientes? Si no, se levanta el bloqueo (HU-17).
  const quedaPendiente = await prestamoRepository.tieneMultaPendiente(multa.prestamo.usuarioId);
  return { id, pagada: true, bloqueoLevantado: !quedaPendiente };
}

module.exports = { listarMultas, pagarMulta };
