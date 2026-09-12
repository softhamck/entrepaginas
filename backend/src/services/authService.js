const bcrypt = require('bcrypt');
const usuarioRepository = require('../repositories/usuarioRepository');

async function registrarUsuario({ nombre, correo, telefono, contrasena }) {
  const existente = await usuarioRepository.buscarPorCorreo(correo);
  if (existente) throw new Error('CORREO_YA_REGISTRADO');

  const contrasenaHash = await bcrypt.hash(contrasena, 10);
  return usuarioRepository.crear({ nombre, correo, telefono, contrasenaHash });
}

const jwt = require('jsonwebtoken');

async function login({ correo, contrasena }) {
  const usuario = await usuarioRepository.buscarPorCorreo(correo);
  if (!usuario) throw new Error('CREDENCIALES_INVALIDAS');

  const valido = await bcrypt.compare(contrasena, usuario.contrasenaHash);
  if (!valido) throw new Error('CREDENCIALES_INVALIDAS');

  return jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '2h' });
}


module.exports = { registrarUsuario, login };