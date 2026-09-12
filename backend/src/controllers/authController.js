const { registrarUsuario, login: loginService } = require('../services/authService');

async function register(req, res) {
  const { nombre, correo, telefono, contrasena } = req.body;

  if (!nombre || !correo || !telefono || !contrasena) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
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
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
}


module.exports = { register, login };