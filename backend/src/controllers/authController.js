const { registrarUsuario, login: loginService } = require('../services/authService');

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  const { nombre, correo, telefono, contrasena } = req.body;

  if (!nombre || !correo || !telefono || !contrasena) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!FORMATO_CORREO.test(correo)) {
    return res.status(400).json({ error: 'El correo no tiene un formato válido' });
  }
  if (contrasena.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const usuario = await registrarUsuario({ nombre, correo, telefono, contrasena });
    return res.status(201).json({ id: usuario.id, nombre: usuario.nombre, correo: usuario.correo });
  } catch (err) {
    if (err.message === 'CORREO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Correo ya registrado' });
    }
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function login(req, res) {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const token = await loginService({ correo, contrasena });
    return res.json({ token });
  } catch (err) {
    if (err.message === 'CREDENCIALES_INVALIDAS') {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (err.message === 'CUENTA_BLOQUEADA') {
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Intenta más tarde.' });
    }
    // Cualquier otro error (ej. BD caída) NO es un problema de credenciales
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function perfil(req, res) {
  // req.usuario lo agrega authMiddleware tras verificar el token
  return res.json({ id: req.usuario.id, rol: req.usuario.rol });
}

module.exports = { register, login, perfil };