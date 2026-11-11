const { listarMultas, pagarMulta } = require('../services/multaService');
const { ReglaNegocioError } = require('../services/prestamoService');

// HU-15: GET /api/multas
async function listar(req, res) {
  try {
    const multas = await listarMultas();
    return res.json(multas);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudieron consultar las multas' });
  }
}

// HU-15: PATCH /api/multas/:id/pagar
async function pagar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador de multa inválido' });
  }
  try {
    const resultado = await pagarMulta(id);
    return res.json(resultado);
  } catch (err) {
    if (err instanceof ReglaNegocioError) {
      return res.status(err.codigo).json({ error: err.message });
    }
    return res.status(500).json({ error: 'No se pudo registrar el pago' });
  }
}

module.exports = { listar, pagar };
