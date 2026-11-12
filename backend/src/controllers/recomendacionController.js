const { obtenerRecomendaciones } = require('../services/recomendacionService');

// SC-001: GET /api/recomendaciones (del usuario autenticado)
async function listar(req, res) {
  try {
    const resultado = await obtenerRecomendaciones(req.usuario.id);
    return res.json(resultado);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudieron generar las recomendaciones' });
  }
}

module.exports = { listar };
