const { solicitarPrestamo, ReglaNegocioError } = require('../services/prestamoService');

// HU-11: POST /api/prestamos  { libroId }
async function solicitar(req, res) {
  const libroId = Number(req.body.libroId);
  if (!Number.isInteger(libroId)) {
    return res.status(400).json({ error: 'Debes indicar un libro válido' });
  }
  try {
    const prestamo = await solicitarPrestamo({ usuarioId: req.usuario.id, libroId });
    return res.status(201).json(prestamo);
  } catch (err) {
    if (err instanceof ReglaNegocioError) {
      return res.status(err.codigo).json({ error: err.message });
    }
    return res.status(500).json({ error: 'No se pudo registrar el préstamo' });
  }
}

module.exports = { solicitar };
