process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/reservaRepository', () => ({
  reservaExistente: jest.fn(),
  contarReservasDeLibro: jest.fn(),
  crearReserva: jest.fn(),
  reservasDeUsuario: jest.fn(),
}));
jest.mock('../src/repositories/prestamoRepository', () => ({
  buscarLibroPorId: jest.fn(),
  tieneMultaPendiente: jest.fn(),
  buscarEjemplarDisponiblePorLibro: jest.fn(),
}));

const reservaRepository = require('../src/repositories/reservaRepository');
const prestamoRepository = require('../src/repositories/prestamoRepository');
const app = require('../src/app');

const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

describe('Reservas / cola de espera (HU-18)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prestamoRepository.buscarLibroPorId.mockResolvedValue({ id: 1, titulo: 'Rayuela' });
    prestamoRepository.tieneMultaPendiente.mockResolvedValue(null);
    prestamoRepository.buscarEjemplarDisponiblePorLibro.mockResolvedValue(null); // sin disponibilidad
    reservaRepository.reservaExistente.mockResolvedValue(null);
    reservaRepository.contarReservasDeLibro.mockResolvedValue(0);
    reservaRepository.crearReserva.mockImplementation(({ posicion }) => Promise.resolve({ id: 10, posicion }));
  });

  describe('POST /api/reservas', () => {
    const reservar = (libroId = 1, token = tokenUsuario) =>
      request(app).post('/api/reservas').set('Authorization', `Bearer ${token}`).send({ libroId });

    test('unirse a la cola -> 201 con posición 1', async () => {
      const res = await reservar();
      expect(res.status).toBe(201);
      expect(res.body.posicion).toBe(1);
    });

    test('posición FIFO al final (ya hay 2 en cola) -> posición 3', async () => {
      reservaRepository.contarReservasDeLibro.mockResolvedValue(2);
      const res = await reservar();
      expect(res.body.posicion).toBe(3);
    });

    test('con multa pendiente -> 409', async () => {
      prestamoRepository.tieneMultaPendiente.mockResolvedValue({ id: 7, pagada: false });
      const res = await reservar();
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/multa/i);
    });

    test('libro con ejemplares disponibles -> 409 (debe pedir préstamo)', async () => {
      prestamoRepository.buscarEjemplarDisponiblePorLibro.mockResolvedValue({ id: 50 });
      const res = await reservar();
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/disponibles/i);
    });

    test('ya está en la cola -> 409', async () => {
      reservaRepository.reservaExistente.mockResolvedValue({ id: 99 });
      const res = await reservar();
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/cola/i);
    });

    test('libro inexistente -> 404', async () => {
      prestamoRepository.buscarLibroPorId.mockResolvedValue(null);
      const res = await reservar();
      expect(res.status).toBe(404);
    });

    test('libroId inválido -> 400', async () => {
      const res = await request(app).post('/api/reservas')
        .set('Authorization', `Bearer ${tokenUsuario}`).send({});
      expect(res.status).toBe(400);
    });

    test('sin sesión -> 401', async () => {
      const res = await request(app).post('/api/reservas').send({ libroId: 1 });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reservas', () => {
    test('mis reservas -> 200 con posición', async () => {
      reservaRepository.reservasDeUsuario.mockResolvedValue([
        { id: 10, posicion: 2, fechaSolicitud: new Date(), libro: { titulo: 'Rayuela', autor: 'Cortázar' } },
      ]);
      const res = await request(app).get('/api/reservas').set('Authorization', `Bearer ${tokenUsuario}`);
      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({ posicion: 2, libro: { titulo: 'Rayuela' } });
    });

    test('sin sesión -> 401', async () => {
      const res = await request(app).get('/api/reservas');
      expect(res.status).toBe(401);
    });
  });
});
