process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/multaRepository', () => ({
  listarMultas: jest.fn(),
  buscarMultaPorId: jest.fn(),
  marcarPagada: jest.fn(),
}));
jest.mock('../src/repositories/prestamoRepository', () => ({
  tieneMultaPendiente: jest.fn(),
}));

const multaRepository = require('../src/repositories/multaRepository');
const prestamoRepository = require('../src/repositories/prestamoRepository');
const app = require('../src/app');

const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });
const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

describe('Gestión de multas (HU-15)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/multas', () => {
    test('listado para admin -> 200 con usuario, libro, monto y estado', async () => {
      multaRepository.listarMultas.mockResolvedValue([
        { id: 1, monto: 3000, pagada: false,
          prestamo: { usuario: { id: 2, nombre: 'Ana' }, ejemplar: { libro: { titulo: 'Rayuela' } } } },
      ]);
      const res = await request(app).get('/api/multas').set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({
        id: 1, monto: 3000, pagada: false,
        usuario: { nombre: 'Ana' }, libro: { titulo: 'Rayuela' },
      });
    });

    test('un asociado no puede ver las multas -> 403', async () => {
      const res = await request(app).get('/api/multas').set('Authorization', `Bearer ${tokenUsuario}`);
      expect(res.status).toBe(403);
    });

    test('sin sesión -> 401', async () => {
      const res = await request(app).get('/api/multas');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/multas/:id/pagar', () => {
    beforeEach(() => {
      multaRepository.buscarMultaPorId.mockResolvedValue({ id: 1, pagada: false, prestamo: { usuarioId: 2 } });
      multaRepository.marcarPagada.mockResolvedValue({ id: 1, pagada: true });
      prestamoRepository.tieneMultaPendiente.mockResolvedValue(null);
    });

    const pagar = (id = 1, token = tokenAdmin) =>
      request(app).patch(`/api/multas/${id}/pagar`).set('Authorization', `Bearer ${token}`);

    test('pago exitoso sin otras multas -> 200 y levanta el bloqueo', async () => {
      const res = await pagar();
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ pagada: true, bloqueoLevantado: true });
    });

    test('pago cuando quedan otras multas -> no levanta el bloqueo', async () => {
      prestamoRepository.tieneMultaPendiente.mockResolvedValue({ id: 9, pagada: false });
      const res = await pagar();
      expect(res.body.bloqueoLevantado).toBe(false);
    });

    test('multa ya pagada -> 409', async () => {
      multaRepository.buscarMultaPorId.mockResolvedValue({ id: 1, pagada: true, prestamo: { usuarioId: 2 } });
      const res = await pagar();
      expect(res.status).toBe(409);
    });

    test('multa inexistente -> 404', async () => {
      multaRepository.buscarMultaPorId.mockResolvedValue(null);
      const res = await pagar(999);
      expect(res.status).toBe(404);
    });

    test('id inválido -> 400', async () => {
      const res = await pagar('abc');
      expect(res.status).toBe(400);
    });

    test('un asociado no puede registrar pago -> 403', async () => {
      const res = await pagar(1, tokenUsuario);
      expect(res.status).toBe(403);
    });

    test('sin sesión -> 401', async () => {
      const res = await request(app).patch('/api/multas/1/pagar');
      expect(res.status).toBe(401);
    });
  });
});
