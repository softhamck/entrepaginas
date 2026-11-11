process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock del repositorio: las pruebas no tocan Prisma ni la base de datos.
jest.mock('../src/repositories/prestamoRepository', () => ({
  buscarLibroPorId: jest.fn(),
  tieneMultaPendiente: jest.fn(),
  contarPrestamosActivos: jest.fn(),
  buscarEjemplarDisponiblePorLibro: jest.fn(),
  crearPrestamo: jest.fn(),
}));

const prestamoRepository = require('../src/repositories/prestamoRepository');
const app = require('../src/app');

const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

describe('Solicitar préstamo (HU-11) - POST /api/prestamos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prestamoRepository.buscarLibroPorId.mockResolvedValue({ id: 1, titulo: 'X' });
    prestamoRepository.tieneMultaPendiente.mockResolvedValue(null);
    prestamoRepository.contarPrestamosActivos.mockResolvedValue(0);
    prestamoRepository.buscarEjemplarDisponiblePorLibro.mockResolvedValue({ id: 50, estado: 'DISPONIBLE' });
    prestamoRepository.crearPrestamo.mockImplementation((d) =>
      Promise.resolve({ id: 100, estado: 'ACTIVO', ...d }));
  });

  const pedir = () => request(app).post('/api/prestamos')
    .set('Authorization', `Bearer ${tokenUsuario}`).send({ libroId: 1 });

  test('préstamo exitoso -> 201, vence en 14 días y toma un ejemplar', async () => {
    const res = await pedir();
    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('ACTIVO');
    const arg = prestamoRepository.crearPrestamo.mock.calls[0][0];
    const dias = Math.round((new Date(arg.fechaVencimiento) - Date.now()) / 86400000);
    expect(dias).toBe(14);
    expect(arg.ejemplarId).toBe(50);
  });

  test('sin ejemplares disponibles -> 409 y ofrece la cola', async () => {
    prestamoRepository.buscarEjemplarDisponiblePorLibro.mockResolvedValue(null);
    const res = await pedir();
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cola de espera/i);
  });

  test('límite de préstamos activos alcanzado -> 409', async () => {
    prestamoRepository.contarPrestamosActivos.mockResolvedValue(3);
    const res = await pedir();
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/máximo/i);
  });

  test('usuario con multa pendiente -> 409', async () => {
    prestamoRepository.tieneMultaPendiente.mockResolvedValue({ id: 7, pagada: false });
    const res = await pedir();
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/multa/i);
  });

  test('libro inexistente -> 404', async () => {
    prestamoRepository.buscarLibroPorId.mockResolvedValue(null);
    const res = await pedir();
    expect(res.status).toBe(404);
  });

  test('libroId inválido -> 400', async () => {
    const res = await request(app).post('/api/prestamos')
      .set('Authorization', `Bearer ${tokenUsuario}`).send({});
    expect(res.status).toBe(400);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).post('/api/prestamos').send({ libroId: 1 });
    expect(res.status).toBe(401);
  });
});
