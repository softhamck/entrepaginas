// Autorización por rol (HU-05).
// Se usa SIEMPRE después de authMiddleware, que deja req.usuario = { id, rol }.
// Permite el paso solo si el rol del usuario está entre los roles permitidos;
// de lo contrario responde 403 con un mensaje claro.
function autorizarRol(...rolesPermitidos) {
  return (req, res, next) => {
    // Defensa: si no hay usuario, el token no pasó por authMiddleware.
    if (!req.usuario || !req.usuario.rol) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a esta sección' });
    }
    next();
  };
}

module.exports = autorizarRol;
