process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Evita instanciar Prisma al importar la app (igual que en auth.integration.test.js).
jest.mock('../src/repositories/usuarioRepository', () => ({
  buscarPorCorreo: jest.fn(),
  crear: jest.fn(),
}));

const app = require('../src/app');

const tokenCon = (rol) => jwt.sign({ id: 1, rol }, 'test-secret', { expiresIn: '2h' });

describe('Control de acceso por rol (HU-05) - GET /api/admin/verificacion', () => {
  test('el administrador entra a su área -> 200', async () => {
    const res = await request(app).get('/api/admin/verificacion')
      .set('Authorization', `Bearer ${tokenCon('ADMIN')}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('el asociado (USUARIO) no puede entrar -> 403', async () => {
    const res = await request(app).get('/api/admin/verificacion')
      .set('Authorization', `Bearer ${tokenCon('USUARIO')}`);
    expect(res.status).toBe(403);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/admin/verificacion');
    expect(res.status).toBe(401);
  });

  test('sesión vencida -> 401', async () => {
    const expirado = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: -10 });
    const res = await request(app).get('/api/admin/verificacion')
      .set('Authorization', `Bearer ${expirado}`);
    expect(res.status).toBe(401);
  });
});
