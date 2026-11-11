const { darDeBajaEjemplar } = require('../services/libroService');
const { ReglaNegocioError } = require('../services/prestamoService');

// Dar de baja un ejemplar (HU-10): DELETE /api/ejemplares/:id
async function darBaja(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador de ejemplar inválido' });
  }
  try {
    const resultado = await darDeBajaEjemplar(id);
    return res.json(resultado);
  } catch (err) {
    if (err instanceof ReglaNegocioError) {
      return res.status(err.codigo).json({ error: err.message });
    }
    return res.status(500).json({ error: 'No se pudo dar de baja el ejemplar' });
  }
}

module.exports = { darBaja };
