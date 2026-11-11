const { obtenerHistorial } = require('../services/prestamoService');

// HU-14: GET /api/usuarios/:id/prestamos
async function historialPrestamos(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }
  // Solo su propio historial, salvo que sea administrador.
  if (req.usuario.rol !== 'ADMIN' && req.usuario.id !== id) {
    return res.status(403).json({ error: 'No puedes consultar el historial de otro usuario' });
  }
  try {
    const historial = await obtenerHistorial(id);
    return res.json(historial);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo consultar el historial' });
  }
}

module.exports = { historialPrestamos };
