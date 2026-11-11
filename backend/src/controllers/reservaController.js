const { crearReserva, misReservas } = require('../services/reservaService');
const { ReglaNegocioError } = require('../services/prestamoService');

// HU-18: POST /api/reservas  { libroId }
async function crear(req, res) {
  const libroId = Number(req.body.libroId);
  if (!Number.isInteger(libroId)) {
    return res.status(400).json({ error: 'Debes indicar un libro válido' });
  }
  try {
    const reserva = await crearReserva({ usuarioId: req.usuario.id, libroId });
    return res.status(201).json(reserva);
  } catch (err) {
    if (err instanceof ReglaNegocioError) {
      return res.status(err.codigo).json({ error: err.message });
    }
    return res.status(500).json({ error: 'No se pudo crear la reserva' });
  }
}

// HU-18/19: GET /api/reservas  (las del usuario autenticado)
async function listar(req, res) {
  try {
    const reservas = await misReservas(req.usuario.id);
    return res.json(reservas);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudieron consultar las reservas' });
  }
}

module.exports = { crear, listar };
