process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/prestamoRepository', () => ({
  buscarLibroPorId: jest.fn(),
  tieneMultaPendiente: jest.fn(),
  contarPrestamosActivos: jest.fn(),
  buscarEjemplarDisponiblePorLibro: jest.fn(),
  crearPrestamo: jest.fn(),
  buscarPrestamoPorId: jest.fn(),
  registrarDevolucion: jest.fn(),
  primeraReservaDelLibro: jest.fn(),
  renovarPrestamo: jest.fn(),
}));

const prestamoRepository = require('../src/repositories/prestamoRepository');
const app = require('../src/app');

const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

// Préstamo del usuario 2, activo, que vence en "diasOffset" días, con "renov" renovaciones.
function prestamo({ diasOffset = 7, renov = 0, usuarioId = 2, estado = 'ACTIVO' } = {}) {
  const venc = new Date();
  venc.setDate(venc.getDate() + diasOffset);
  return { id: 100, usuarioId, estado, renovaciones: renov, fechaVencimiento: venc, ejemplar: { id: 50, libroId: 1 } };
}

describe('Renovar préstamo (HU-13) - PATCH /api/prestamos/:id/renovar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(prestamo());
    prestamoRepository.tieneMultaPendiente.mockResolvedValue(null);
    prestamoRepository.primeraReservaDelLibro.mockResolvedValue(null);
    prestamoRepository.renovarPrestamo.mockImplementation(({ nuevaFecha }) =>
      Promise.resolve({ id: 100, renovaciones: 1, fechaVencimiento: nuevaFecha }));
  });

  const renovar = (id = 100, token = tokenUsuario) =>
    request(app).patch(`/api/prestamos/${id}/renovar`).set('Authorization', `Bearer ${token}`);

  test('renovación exitosa -> 200 y extiende 14 días desde el vencimiento', async () => {
    const original = prestamo({ diasOffset: 7 });
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(original);
    const res = await renovar();
    expect(res.status).toBe(200);
    const arg = prestamoRepository.renovarPrestamo.mock.calls[0][0];
    const dias = Math.round((new Date(arg.nuevaFecha) - new Date(original.fechaVencimiento)) / 86400000);
    expect(dias).toBe(14);
  });

  test('préstamo vencido -> 409', async () => {
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(prestamo({ diasOffset: -1 }));
    const res = await renovar();
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/vencido/i);
  });

  test('ya renovado una vez -> 409', async () => {
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(prestamo({ renov: 1 }));
    const res = await renovar();
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/una vez/i);
  });

  test('libro con cola de espera -> 409', async () => {
    prestamoRepository.primeraReservaDelLibro.mockResolvedValue({ id: 9, posicion: 1 });
    const res = await renovar();
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/reservas/i);
  });

  test('usuario con multa pendiente -> 409', async () => {
    prestamoRepository.tieneMultaPendiente.mockResolvedValue({ id: 7, pagada: false });
    const res = await renovar();
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/multa/i);
  });

  test('préstamo de otro usuario -> 404', async () => {
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(prestamo({ usuarioId: 999 }));
    const res = await renovar();
    expect(res.status).toBe(404);
  });

  test('préstamo inexistente -> 404', async () => {
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(null);
    const res = await renovar();
    expect(res.status).toBe(404);
  });

  test('id inválido -> 400', async () => {
    const res = await renovar('abc');
    expect(res.status).toBe(400);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).patch('/api/prestamos/100/renovar');
    expect(res.status).toBe(401);
  });
});
