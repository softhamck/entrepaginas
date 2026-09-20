const jwt = require('jsonwebtoken');

// Verifica el JWT en rutas protegidas.
// Responde 401 si falta, está expirado o fue manipulado (HU-04 criterios 4 y 5).
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, rol: payload.rol };
    next();
  } catch {
    // jwt.verify lanza si el token está expirado o alterado
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = authMiddleware;