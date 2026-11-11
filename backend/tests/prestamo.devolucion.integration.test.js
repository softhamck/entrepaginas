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
}));

const prestamoRepository = require('../src/repositories/prestamoRepository');
const { TARIFA_MULTA_DIARIA } = require('../src/services/prestamoService');
const app = require('../src/app');

const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });
const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

// Préstamo activo con vencimiento a "diasOffset" días de hoy (negativo = ya venció).
function prestamoActivo(diasOffset = 5) {
  const venc = new Date();
  venc.setDate(venc.getDate() + diasOffset);
  return { id: 100, estado: 'ACTIVO', ejemplarId: 50, fechaVencimiento: venc, ejemplar: { id: 50, libroId: 1 } };
}

describe('Registrar devolución (HU-12) - PATCH /api/prestamos/:id/devolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(prestamoActivo(5));
    prestamoRepository.primeraReservaDelLibro.mockResolvedValue(null);
    prestamoRepository.registrarDevolucion.mockImplementation(({ prestamoId }) =>
      Promise.resolve({ id: prestamoId, estado: 'DEVUELTO' }));
  });

  const devolver = (id = 100, token = tokenAdmin) =>
    request(app).patch(`/api/prestamos/${id}/devolver`).set('Authorization', `Bearer ${token}`);

  test('devolución a tiempo -> 200, DEVUELTO y sin multa', async () => {
    const res = await devolver();
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('DEVUELTO');
    expect(res.body.diasAtraso).toBe(0);
    expect(res.body.multa).toBeNull();
    const arg = prestamoRepository.registrarDevolucion.mock.calls[0][0];
    expect(arg.multa).toBeNull();
  });

  test('devolución con atraso -> genera multa por días de atraso', async () => {
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(prestamoActivo(-3)); // venció hace 3 días
    const res = await devolver();
    expect(res.status).toBe(200);
    expect(res.body.diasAtraso).toBe(3);
    expect(res.body.multa.monto).toBe(3 * TARIFA_MULTA_DIARIA);
    const arg = prestamoRepository.registrarDevolucion.mock.calls[0][0];
    expect(arg.multa.monto).toBe(3 * TARIFA_MULTA_DIARIA);
  });

  test('devolución libera la cola -> informa al siguiente en espera', async () => {
    prestamoRepository.primeraReservaDelLibro.mockResolvedValue({ id: 9, usuarioId: 7, posicion: 1 });
    const res = await devolver();
    expect(res.status).toBe(200);
    expect(res.body.siguienteEnCola).toMatchObject({ usuarioId: 7, posicion: 1 });
  });

  test('préstamo inexistente -> 404', async () => {
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue(null);
    const res = await devolver(999);
    expect(res.status).toBe(404);
  });

  test('préstamo ya devuelto -> 404', async () => {
    prestamoRepository.buscarPrestamoPorId.mockResolvedValue({ ...prestamoActivo(), estado: 'DEVUELTO' });
    const res = await devolver();
    expect(res.status).toBe(404);
  });

  test('id inválido -> 400', async () => {
    const res = await devolver('abc');
    expect(res.status).toBe(400);
  });

  test('un asociado no puede registrar devolución -> 403', async () => {
    const res = await devolver(100, tokenUsuario);
    expect(res.status).toBe(403);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).patch('/api/prestamos/100/devolver');
    expect(res.status).toBe(401);
  });
});
