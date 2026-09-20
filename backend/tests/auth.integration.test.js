process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
jest.mock('../src/repositories/usuarioRepository', () => ({
  buscarPorCorreo: jest.fn(),
  buscarPorId: jest.fn(),
  crear: jest.fn(),
}));
const usuarioRepository = require('../src/repositories/usuarioRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('registro exitoso -> 201', async () => {
    usuarioRepository.buscarPorCorreo.mockResolvedValue(null);
    usuarioRepository.crear.mockImplementation((d) => Promise.resolve({ id: 1, ...d }));
    const res = await request(app).post('/api/auth/register')
      .send({ nombre: 'Ana', correo: 'ana@mail.com', telefono: '3000000000', contrasena: '12345678' });
    expect(res.status).toBe(201);
    expect(res.body.correo).toBe('ana@mail.com');
  });

  test('correo con formato inválido -> 400', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ nombre: 'Ana', correo: 'correo-malo', telefono: '3000000000', contrasena: '12345678' });
    expect(res.status).toBe(400);
  });

  test('contraseña corta -> 400', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ nombre: 'Ana', correo: 'ana@mail.com', telefono: '3000000000', contrasena: '123' });
    expect(res.status).toBe(400);
  });

  test('campos faltantes -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ correo: 'ana@mail.com' });
    expect(res.status).toBe(400);
  });

  test('correo duplicado -> 400', async () => {
    usuarioRepository.buscarPorCorreo.mockResolvedValue({ id: 1 });
    const res = await request(app).post('/api/auth/register')
      .send({ nombre: 'Ana', correo: 'ana@mail.com', telefono: '3000000000', contrasena: '12345678' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('login exitoso -> 200 con token', async () => {
    const hash = await bcrypt.hash('correcta123', 10);
    usuarioRepository.buscarPorCorreo.mockResolvedValue({ id: 1, contrasenaHash: hash, rol: 'USUARIO' });
    const res = await request(app).post('/api/auth/login')
      .send({ correo: 'login-ok@mail.com', contrasena: 'correcta123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  test('credenciales inválidas -> 401 (mensaje genérico)', async () => {
    const hash = await bcrypt.hash('correcta123', 10);
    usuarioRepository.buscarPorCorreo.mockResolvedValue({ id: 1, contrasenaHash: hash, rol: 'USUARIO' });
    const res = await request(app).post('/api/auth/login')
      .send({ correo: 'login-bad@mail.com', contrasena: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  test('campos vacíos -> 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ correo: 'x@mail.com' });
    expect(res.status).toBe(400);
  });

  test('error interno (BD caída) -> 500, no 401', async () => {
    usuarioRepository.buscarPorCorreo.mockRejectedValue(new Error('DB_DOWN'));
    const res = await request(app).post('/api/auth/login')
      .send({ correo: 'err@mail.com', contrasena: 'algo12345' });
    expect(res.status).toBe(500);
  });

  test('bloqueo tras 5 intentos fallidos -> 429', async () => {
    const hash = await bcrypt.hash('correcta123', 10);
    usuarioRepository.buscarPorCorreo.mockResolvedValue({ id: 1, contrasenaHash: hash, rol: 'USUARIO' });
    const correo = 'bloqueo@mail.com';
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ correo, contrasena: 'mala' });
    }
    const res = await request(app).post('/api/auth/login').send({ correo, contrasena: 'mala' });
    expect(res.status).toBe(429);
  });
});

describe('GET /api/auth/me (endpoint protegido)', () => {
  test('sin token -> 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('token manipulado -> 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  test('token expirado -> 401', async () => {
    const expirado = jwt.sign({ id: 1, rol: 'USUARIO' }, 'test-secret', { expiresIn: -10 });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expirado}`);
    expect(res.status).toBe(401);
  });

  test('token válido -> 200', async () => {
    const valido = jwt.sign({ id: 1, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${valido}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });
});