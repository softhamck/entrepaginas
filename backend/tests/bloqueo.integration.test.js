process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mocks de todos los repositorios que intervienen en la regla de bloqueo.
jest.mock('../src/repositories/multaRepository', () => ({
  listarMultas: jest.fn(), buscarMultaPorId: jest.fn(), marcarPagada: jest.fn(),
  contarPendientesPorUsuario: jest.fn(),
}));
jest.mock('../src/repositories/prestamoRepository', () => ({
  buscarLibroPorId: jest.fn(), tieneMultaPendiente: jest.fn(), contarPrestamosActivos: jest.fn(),
  buscarEjemplarDisponiblePorLibro: jest.fn(), crearPrestamo: jest.fn(),
}));
jest.mock('../src/repositories/reservaRepository', () => ({
  reservaExistente: jest.fn(), contarReservasDeLibro: jest.fn(), crearReserva: jest.fn(),
  reservasDeUsuario: jest.fn(),
}));
jest.mock('../src/repositories/libroRepository', () => ({
  buscarLibros: jest.fn(), buscarLibroPorId: jest.fn(),
}));

const multaRepository = require('../src/repositories/multaRepository');
const prestamoRepository = require('../src/repositories/prestamoRepository');
const reservaRepository = require('../src/repositories/reservaRepository');
const libroRepository = require('../src/repositories/libroRepository');
const app = require('../src/app');

const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });
const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });

describe('Bloqueo por multa (HU-17)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/usuarios/:id/bloqueo (estado)', () => {
    const consultar = (id = 2, token = tokenUsuario) =>
      request(app).get(`/api/usuarios/${id}/bloqueo`).set('Authorization', `Bearer ${token}`);

    test('con multa pendiente -> bloqueado true', async () => {
      multaRepository.contarPendientesPorUsuario.mockResolvedValue(2);
      const res = await consultar();
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ bloqueado: true, multasPendientes: 2 });
    });

    test('sin multas -> bloqueado false', async () => {
      multaRepository.contarPendientesPorUsuario.mockResolvedValue(0);
      const res = await consultar();
      expect(res.body).toMatchObject({ bloqueado: false, multasPendientes: 0 });
    });

    test('el admin puede consultar cualquier usuario -> 200', async () => {
      multaRepository.contarPendientesPorUsuario.mockResolvedValue(0);
      const res = await consultar(2, tokenAdmin);
      expect(res.status).toBe(200);
    });

    test('consultar el bloqueo de otro usuario -> 403', async () => {
      const res = await consultar(999);
      expect(res.status).toBe(403);
    });

    test('sin sesión -> 401', async () => {
      const res = await request(app).get('/api/usuarios/2/bloqueo');
      expect(res.status).toBe(401);
    });
  });

  // Documenta que la regla de bloqueo se aplica de forma consistente en todo el sistema.
  describe('La regla de bloqueo se cumple en todos los puntos', () => {
    test('con multa: NO puede solicitar préstamo (409) - HU-11', async () => {
      prestamoRepository.buscarLibroPorId.mockResolvedValue({ id: 1 });
      prestamoRepository.tieneMultaPendiente.mockResolvedValue({ id: 7, pagada: false });
      const res = await request(app).post('/api/prestamos')
        .set('Authorization', `Bearer ${tokenUsuario}`).send({ libroId: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/multa/i);
    });

    test('con multa: NO puede reservar (409) - HU-18', async () => {
      prestamoRepository.buscarLibroPorId.mockResolvedValue({ id: 1 });
      prestamoRepository.tieneMultaPendiente.mockResolvedValue({ id: 7, pagada: false });
      const res = await request(app).post('/api/reservas')
        .set('Authorization', `Bearer ${tokenUsuario}`).send({ libroId: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/multa/i);
    });

    test('con multa: SÍ puede consultar el catálogo (200) - consulta permitida', async () => {
      libroRepository.buscarLibros.mockResolvedValue([]);
      const res = await request(app).get('/api/libros')
        .set('Authorization', `Bearer ${tokenUsuario}`);
      expect(res.status).toBe(200);
    });
  });
});
