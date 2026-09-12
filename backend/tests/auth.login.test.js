jest.mock('../src/repositories/usuarioRepository');
const bcrypt = require('bcrypt');
const usuarioRepository = require('../src/repositories/usuarioRepository');
const { login } = require('../src/services/authService');

test('rechaza contraseña incorrecta', async () => {
  const hash = await bcrypt.hash('correcta123', 10);
  usuarioRepository.buscarPorCorreo.mockResolvedValue({ id: 1, contrasenaHash: hash, rol: 'USUARIO' });
  await expect(login({ correo: 'ana@mail.com', contrasena: 'incorrecta' })).rejects.toThrow('CREDENCIALES_INVALIDAS');
});

test('genera token con credenciales correctas', async () => {
  const hash = await bcrypt.hash('correcta123', 10);
  usuarioRepository.buscarPorCorreo.mockResolvedValue({ id: 1, contrasenaHash: hash, rol: 'USUARIO' });
  const token = await login({ correo: 'ana@mail.com', contrasena: 'correcta123' });
  expect(typeof token).toBe('string');
});