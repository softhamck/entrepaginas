const recomendacionRepository = require('../repositories/recomendacionRepository');
const usuarioRepository = require('../repositories/usuarioRepository');

const MIN_PRESTAMOS = 3; // historial mínimo para recomendar (SC-001 esc. 2 / 4.1)
const LIMITE = 6;        // máximo de recomendaciones

/**
 * Recomendaciones "Para ti" (SC-001).
 * Motor de reglas (no IA generativa): solo recomienda libros del catálogo,
 * según los géneros que el usuario más ha prestado, excluyendo lo ya leído.
 * Requiere consentimiento y un historial mínimo. Cumple GR-1, GR-3, GR-4, GR-6.
 */
async function obtenerRecomendaciones(usuarioId) {
  const usuario = await usuarioRepository.buscarPorId(usuarioId);
  if (!usuario) return { habilitado: false, motivo: 'usuario_no_encontrado', recomendaciones: [] };

  // Esc. 4 (sección 7): sin consentimiento no se procesa el historial.
  if (!usuario.consentimiento) {
    return { habilitado: false, motivo: 'sin_consentimiento', recomendaciones: [] };
  }

  const prestamos = await recomendacionRepository.prestamosConCategoria(usuarioId);

  // Esc. 2 (4.1 AC-1): historial insuficiente.
  if (prestamos.length < MIN_PRESTAMOS) {
    return { habilitado: false, motivo: 'historial_insuficiente', recomendaciones: [] };
  }

  // Géneros más frecuentes del historial + libros ya leídos (GR-3).
  const conteo = {};
  const librosLeidos = new Set();
  for (const p of prestamos) {
    const libro = p.ejemplar.libro;
    librosLeidos.add(libro.id);
    if (libro.categoria) conteo[libro.categoria] = (conteo[libro.categoria] || 0) + 1;
  }
  const categorias = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]);
  if (categorias.length === 0) return { habilitado: true, recomendaciones: [] };

  // Esc. 1 y 3 (GR-1): solo libros del catálogo en esos géneros, que no haya leído.
  const libros = await recomendacionRepository.librosRecomendables({
    categorias,
    excluirLibroIds: [...librosLeidos],
    limite: LIMITE,
  });

  // GR-4: cada recomendación lleva su motivo basado en el historial.
  const recomendaciones = libros.map((l) => ({
    id: l.id,
    titulo: l.titulo,
    autor: l.autor,
    categoria: l.categoria,
    motivo: `Porque has leído ${l.categoria}`,
  }));

  return { habilitado: true, recomendaciones };
}

// Activa o revoca el consentimiento (SC-001 sección 7).
async function actualizarConsentimiento(usuarioId, consentimiento) {
  await usuarioRepository.actualizarConsentimiento(usuarioId, Boolean(consentimiento));
  return { consentimiento: Boolean(consentimiento) };
}

module.exports = { obtenerRecomendaciones, actualizarConsentimiento, MIN_PRESTAMOS };
