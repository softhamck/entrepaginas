const bcrypt = require('bcrypt');
const usuarioRepository = require('../repositories/usuarioRepository');

async function registrarUsuario({ nombre, correo, telefono, contrasena }) {
  const existente = await usuarioRepository.buscarPorCorreo(correo);
  if (existente) throw new Error('CORREO_YA_REGISTRADO');

  const contrasenaHash = await bcrypt.hash(contrasena, 10);
  return usuarioRepository.crear({ nombre, correo, telefono, contrasenaHash });
}

module.exports = { registrarUsuario };