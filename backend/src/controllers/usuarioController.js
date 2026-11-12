const { obtenerHistorial } = require('../services/prestamoService');
const { actualizarConsentimiento } = require('../services/recomendacionService');
const { estadoBloqueo } = require('../services/multaService');

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

// SC-001: PATCH /api/usuarios/:id/consentimiento  { consentimiento: boolean }
async function cambiarConsentimiento(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }
  if (req.usuario.rol !== 'ADMIN' && req.usuario.id !== id) {
    return res.status(403).json({ error: 'No puedes cambiar el consentimiento de otro usuario' });
  }
  if (typeof req.body.consentimiento !== 'boolean') {
    return res.status(400).json({ error: 'El consentimiento debe ser true o false' });
  }
  try {
    const resultado = await actualizarConsentimiento(id, req.body.consentimiento);
    return res.json(resultado);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo actualizar el consentimiento' });
  }
}

// HU-17: GET /api/usuarios/:id/bloqueo
async function bloqueo(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }
  if (req.usuario.rol !== 'ADMIN' && req.usuario.id !== id) {
    return res.status(403).json({ error: 'No puedes consultar el bloqueo de otro usuario' });
  }
  try {
    const estado = await estadoBloqueo(id);
    return res.json(estado);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo consultar el estado de bloqueo' });
  }
}

module.exports = { historialPrestamos, cambiarConsentimiento, bloqueo };
