process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/usuarioRepository', () => ({
  buscarPorCorreo: jest.fn(), crear: jest.fn(),
}));
jest.mock('../src/repositories/libroRepository', () => ({
  buscarLibroPorTituloAutor: jest.fn(), crearLibro: jest.fn(),
  buscarEjemplarPorCodigo: jest.fn(), crearEjemplar: jest.fn(),
  buscarLibros: jest.fn(), buscarLibroPorId: jest.fn(),
}));

const libroRepository = require('../src/repositories/libroRepository');
const app = require('../src/app');

const token = jwt.sign({ id: 1, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

const LIBRO = {
  id: 7, titulo: 'Agata de Medellin', autor: 'Juan Jose Hoyos',
  signatura: '843.92 J86a', categoria: 'Cronica', descripcion: 'x',
  ejemplares: [{ estado: 'DISPONIBLE' }, { estado: 'PRESTADO' }],
};

describe('Detalle de libro (HU-09) - GET /api/libros/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('libro existente -> 200 con ficha y sin costo', async () => {
    libroRepository.buscarLibroPorId.mockResolvedValue(LIBRO);
    const res = await request(app).get('/api/libros/7')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Agata de Medellin');
    expect(res.body.disponibles).toBe(1);
    expect(res.body.disponible).toBe(true);
    expect(res.body).not.toHaveProperty('costo');
  });

  test('libro sin ejemplares disponibles -> disponible=false', async () => {
    libroRepository.buscarLibroPorId.mockResolvedValue({ ...LIBRO, ejemplares: [{ estado: 'PRESTADO' }] });
    const res = await request(app).get('/api/libros/7')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.disponible).toBe(false);
  });

  test('libro inexistente -> 404', async () => {
    libroRepository.buscarLibroPorId.mockResolvedValue(null);
    const res = await request(app).get('/api/libros/999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('id inválido -> 400', async () => {
    const res = await request(app).get('/api/libros/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/libros/7');
    expect(res.status).toBe(401);
  });
});
