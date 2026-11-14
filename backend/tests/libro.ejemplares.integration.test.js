process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/libroRepository', () => ({
  buscarLibroPorId: jest.fn(),
  listarEjemplaresDeLibro: jest.fn(),
}));

const libroRepository = require('../src/repositories/libroRepository');
const app = require('../src/app');

const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });
const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

describe('Ejemplares de un libro (HU-10) - GET /api/libros/:id/ejemplares', () => {
  beforeEach(() => jest.clearAllMocks());
  const pedir = (id = 1, token = tokenAdmin) =>
    request(app).get(`/api/libros/${id}/ejemplares`).set('Authorization', `Bearer ${token}`);

  test('admin lista ejemplares -> 200 con id, codigo y estado', async () => {
    libroRepository.buscarLibroPorId.mockResolvedValue({ id: 1, titulo: 'Rayuela' });
    libroRepository.listarEjemplaresDeLibro.mockResolvedValue([
      { id: 10, codigo: 'A-001', estado: 'DISPONIBLE' },
      { id: 11, codigo: 'A-002', estado: 'PRESTADO' },
    ]);
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ id: 10, codigo: 'A-001', estado: 'DISPONIBLE' });
  });

  test('libro inexistente -> 404', async () => {
    libroRepository.buscarLibroPorId.mockResolvedValue(null);
    const res = await pedir(999);
    expect(res.status).toBe(404);
  });

  test('un asociado no puede listar ejemplares -> 403', async () => {
    const res = await pedir(1, tokenUsuario);
    expect(res.status).toBe(403);
  });

  test('id inválido -> 400', async () => {
    libroRepository.buscarLibroPorId.mockResolvedValue({ id: 1 });
    const res = await pedir('abc');
    expect(res.status).toBe(400);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/libros/1/ejemplares');
    expect(res.status).toBe(401);
  });
});
