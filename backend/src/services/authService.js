const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');

// --- Bloqueo por intentos fallidos (en memoria, se reinicia al reiniciar el servidor).
// Suficiente para el MVP; una versión persistente usaría columnas en la tabla Usuario.
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos
const intentos = new Map(); // correo -> { fallos, bloqueadoHasta }

function estaBloqueado(correo) {
  const reg = intentos.get(correo);
  if (!reg || !reg.bloqueadoHasta) return false;
  if (Date.now() < reg.bloqueadoHasta) return true;
  intentos.delete(correo); // el bloqueo ya expiró
  return false;
}

function registrarFallo(correo) {
  const reg = intentos.get(correo) || { fallos: 0, bloqueadoHasta: null };
  reg.fallos += 1;
  if (reg.fallos >= MAX_INTENTOS) reg.bloqueadoHasta = Date.now() + BLOQUEO_MS;
  intentos.set(correo, reg);
}

function limpiarIntentos(correo) {
  intentos.delete(correo);
}

async function registrarUsuario({ nombre, correo, telefono, contrasena }) {
  const existente = await usuarioRepository.buscarPorCorreo(correo);
  if (existente) throw new Error('CORREO_YA_REGISTRADO');
  const contrasenaHash = await bcrypt.hash(contrasena, 10);
  return usuarioRepository.crear({ nombre, correo, telefono, contrasenaHash });
}

async function login({ correo, contrasena }) {
  if (estaBloqueado(correo)) throw new Error('CUENTA_BLOQUEADA');

  const usuario = await usuarioRepository.buscarPorCorreo(correo);
  if (!usuario) {
    registrarFallo(correo);
    throw new Error('CREDENCIALES_INVALIDAS');
  }

  const valido = await bcrypt.compare(contrasena, usuario.contrasenaHash);
  if (!valido) {
    registrarFallo(correo);
    throw new Error('CREDENCIALES_INVALIDAS');
  }

  limpiarIntentos(correo);
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

module.exports = { registrarUsuario, login };