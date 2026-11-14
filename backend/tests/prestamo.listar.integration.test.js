process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/prestamoRepository', () => ({
  listarPrestamos: jest.fn(),
}));

const prestamoRepository = require('../src/repositories/prestamoRepository');
const app = require('../src/app');

const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });
const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

function conDias(dias) { const d = new Date(); d.setDate(d.getDate() + dias); return d; }
function fila({ id = 1, estado = 'ACTIVO', venceEn = 5 } = {}) {
  return {
    id, estado, fechaPrestamo: conDias(-3), fechaVencimiento: conDias(venceEn),
    usuario: { id: 2, nombre: 'Ana' }, ejemplar: { libro: { titulo: 'Rayuela' } },
  };
}

describe('Listar préstamos (HU-12) - GET /api/prestamos', () => {
  beforeEach(() => jest.clearAllMocks());
  const pedir = (qs = '', token = tokenAdmin) =>
    request(app).get(`/api/prestamos${qs}`).set('Authorization', `Bearer ${token}`);

  test('admin lista -> 200 con usuario, libro y estado', async () => {
    prestamoRepository.listarPrestamos.mockResolvedValue([fila({ venceEn: 5 })]);
    const res = await pedir('?estado=ACTIVO');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      usuario: { nombre: 'Ana' }, libro: { titulo: 'Rayuela' }, estado: 'ACTIVO',
    });
    expect(prestamoRepository.listarPrestamos).toHaveBeenCalledWith({ estado: 'ACTIVO' });
  });

  test('préstamo vencido -> estado VENCIDO con días de atraso', async () => {
    prestamoRepository.listarPrestamos.mockResolvedValue([fila({ venceEn: -3 })]);
    const res = await pedir('?estado=ACTIVO');
    expect(res.body[0].estado).toBe('VENCIDO');
    expect(res.body[0].diasAtraso).toBe(3);
  });

  test('un asociado no puede listar -> 403', async () => {
    const res = await pedir('', tokenUsuario);
    expect(res.status).toBe(403);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/prestamos');
    expect(res.status).toBe(401);
  });
});
