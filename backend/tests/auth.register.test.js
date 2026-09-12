jest.mock('../src/repositories/usuarioRepository');
const usuarioRepository = require('../src/repositories/usuarioRepository');
const { registrarUsuario } = require('../src/services/authService');

test('rechaza correo duplicado', async () => {
  usuarioRepository.buscarPorCorreo.mockResolvedValue({ id: 1 });
  await expect(registrarUsuario({ nombre: 'Ana', correo: 'ana@mail.com', telefono: '3000000000', contrasena: '12345678' }))
    .rejects.toThrow('CORREO_YA_REGISTRADO');
});

test('crea usuario con contraseña hasheada', async () => {
  usuarioRepository.buscarPorCorreo.mockResolvedValue(null);
  usuarioRepository.crear.mockImplementation((data) => Promise.resolve({ id: 1, ...data }));
  const usuario = await registrarUsuario({ nombre: 'Ana', correo: 'ana@mail.com', telefono: '3000000000', contrasena: '12345678' });
  expect(usuario.contrasenaHash).not.toBe('12345678');
});