const { solicitarPrestamo, devolverPrestamo, renovarPrestamo, listarPrestamos, ReglaNegocioError } = require('../services/prestamoService');

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

// HU-12: PATCH /api/prestamos/:id/devolver
async function devolver(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador de préstamo inválido' });
  }
  try {
    const resultado = await devolverPrestamo({ prestamoId: id });
    return res.json(resultado);
  } catch (err) {
    if (err instanceof ReglaNegocioError) {
      return res.status(err.codigo).json({ error: err.message });
    }
    return res.status(500).json({ error: 'No se pudo registrar la devolución' });
  }
}

// HU-13: PATCH /api/prestamos/:id/renovar
async function renovar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Identificador de préstamo inválido' });
  }
  try {
    const prestamo = await renovarPrestamo({ prestamoId: id, usuarioId: req.usuario.id });
    return res.json(prestamo);
  } catch (err) {
    if (err instanceof ReglaNegocioError) {
      return res.status(err.codigo).json({ error: err.message });
    }
    return res.status(500).json({ error: 'No se pudo renovar el préstamo' });
  }
}

// HU-12: GET /api/prestamos?estado=ACTIVO  (listado para el administrador)
async function listar(req, res) {
  try {
    const prestamos = await listarPrestamos({ estado: req.query.estado });
    return res.json(prestamos);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudieron consultar los préstamos' });
  }
}

module.exports = { solicitar, devolver, renovar, listar };
