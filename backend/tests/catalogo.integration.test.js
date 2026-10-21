process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/usuarioRepository', () => ({
  buscarPorCorreo: jest.fn(), crear: jest.fn(),
}));
jest.mock('../src/repositories/libroRepository', () => ({
  buscarLibroPorTituloAutor: jest.fn(), crearLibro: jest.fn(),
  buscarEjemplarPorCodigo: jest.fn(), crearEjemplar: jest.fn(),
  buscarLibros: jest.fn(),
}));

const libroRepository = require('../src/repositories/libroRepository');
const app = require('../src/app');

const token = jwt.sign({ id: 1, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

const LIBRO = {
  id: 1, titulo: 'Los divinos', autor: 'Laura Restrepo',
  signatura: 'C863 R436div', categoria: 'Novela', descripcion: 'x',
  ejemplares: [{ estado: 'DISPONIBLE' }, { estado: 'PRESTADO' }],
};

describe('Catálogo (HU-08) - GET /api/libros', () => {
  beforeEach(() => jest.clearAllMocks());

  test('búsqueda con resultados -> 200 con disponibilidad', async () => {
    libroRepository.buscarLibros.mockResolvedValue([LIBRO]);
    const res = await request(app).get('/api/libros?q=divinos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].disponibles).toBe(1);
    expect(res.body[0].disponible).toBe(true);
  });

  test('el costo NO se expone al asociado', async () => {
    libroRepository.buscarLibros.mockResolvedValue([LIBRO]);
    const res = await request(app).get('/api/libros')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body[0]).not.toHaveProperty('costo');
  });

  test('filtros se pasan al repositorio', async () => {
    libroRepository.buscarLibros.mockResolvedValue([]);
    await request(app).get('/api/libros?categoria=Novela&disponibles=true')
      .set('Authorization', `Bearer ${token}`);
    expect(libroRepository.buscarLibros).toHaveBeenCalledWith(
      expect.objectContaining({ categoria: 'Novela', soloDisponibles: true }));
  });

  test('sin resultados -> arreglo vacío', async () => {
    libroRepository.buscarLibros.mockResolvedValue([]);
    const res = await request(app).get('/api/libros?q=nada')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/libros');
    expect(res.status).toBe(401);
  });

  test('libro sin ejemplares disponibles -> disponible=false', async () => {
    libroRepository.buscarLibros.mockResolvedValue([
      { ...LIBRO, ejemplares: [{ estado: 'PRESTADO' }] }]);
    const res = await request(app).get('/api/libros')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body[0].disponible).toBe(false);
    expect(res.body[0].disponibles).toBe(0);
  });
});
