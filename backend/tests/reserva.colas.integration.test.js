process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/reservaRepository', () => ({
  listarTodas: jest.fn(),
}));

const reservaRepository = require('../src/repositories/reservaRepository');
const app = require('../src/app');

const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });
const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

describe('Colas de espera (HU-18) - GET /api/reservas/colas', () => {
  beforeEach(() => jest.clearAllMocks());
  const pedir = (token = tokenAdmin) =>
    request(app).get('/api/reservas/colas').set('Authorization', `Bearer ${token}`);

  test('admin -> 200, reservas agrupadas por libro y ordenadas por posición', async () => {
    reservaRepository.listarTodas.mockResolvedValue([
      { id: 10, libroId: 1, posicion: 1, fechaSolicitud: new Date(), libro: { titulo: 'Dune', autor: 'Herbert' }, usuario: { id: 2, nombre: 'Ana' } },
      { id: 11, libroId: 1, posicion: 2, fechaSolicitud: new Date(), libro: { titulo: 'Dune', autor: 'Herbert' }, usuario: { id: 3, nombre: 'Luis' } },
      { id: 12, libroId: 5, posicion: 1, fechaSolicitud: new Date(), libro: { titulo: 'Fundación', autor: 'Asimov' }, usuario: { id: 2, nombre: 'Ana' } },
    ]);
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2); // dos libros con cola
    const dune = res.body.find((c) => c.libro.titulo === 'Dune');
    expect(dune.cola).toHaveLength(2);
    expect(dune.cola[0]).toMatchObject({ posicion: 1, usuario: { nombre: 'Ana' } });
  });

  test('sin colas -> 200 lista vacía', async () => {
    reservaRepository.listarTodas.mockResolvedValue([]);
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('un asociado no puede ver las colas -> 403', async () => {
    const res = await pedir(tokenUsuario);
    expect(res.status).toBe(403);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/reservas/colas');
    expect(res.status).toBe(401);
  });
});
