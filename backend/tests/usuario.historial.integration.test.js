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
  buscarPrestamosPorUsuario: jest.fn(),
}));

const prestamoRepository = require('../src/repositories/prestamoRepository');
const app = require('../src/app');

const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });
const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });

function conDias(dias) { const d = new Date(); d.setDate(d.getDate() + dias); return d; }

// Un préstamo del usuario 2, con libro, estado y multa configurables.
function prestamo({ id = 1, estado = 'ACTIVO', venceEn = 10, multa = null } = {}) {
  return {
    id, usuarioId: 2, estado,
    fechaPrestamo: conDias(-5),
    fechaVencimiento: conDias(venceEn),
    fechaDevolucion: estado === 'DEVUELTO' ? conDias(-1) : null,
    ejemplar: { libro: { titulo: `Libro ${id}`, autor: 'Autor' } },
    multa,
  };
}

describe('Historial de préstamos (HU-14) - GET /api/usuarios/:id/prestamos', () => {
  beforeEach(() => jest.clearAllMocks());

  const pedir = (id = 2, token = tokenUsuario) =>
    request(app).get(`/api/usuarios/${id}/prestamos`).set('Authorization', `Bearer ${token}`);

  test('historial propio -> 200 con estados clasificados', async () => {
    prestamoRepository.buscarPrestamosPorUsuario.mockResolvedValue([
      prestamo({ id: 1, estado: 'ACTIVO', venceEn: 10 }),
      prestamo({ id: 2, estado: 'ACTIVO', venceEn: -2 }),                 // vencido
      prestamo({ id: 3, estado: 'DEVUELTO', venceEn: -8 }),
    ]);
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ estado: 'ACTIVO', porVencer: false });
    expect(res.body[1].estado).toBe('VENCIDO');
    expect(res.body[2].estado).toBe('DEVUELTO');
    expect(res.body[2].diasRestantes).toBeNull();
  });

  test('préstamo por vencer -> porVencer true y días restantes', async () => {
    prestamoRepository.buscarPrestamosPorUsuario.mockResolvedValue([
      prestamo({ id: 1, estado: 'ACTIVO', venceEn: 2 }),
    ]);
    const res = await pedir();
    expect(res.body[0].porVencer).toBe(true);
    expect(res.body[0].diasRestantes).toBe(2);
  });

  test('préstamo vencido con multa -> estado VENCIDO y valor de multa', async () => {
    prestamoRepository.buscarPrestamosPorUsuario.mockResolvedValue([
      prestamo({ id: 1, estado: 'ACTIVO', venceEn: -3, multa: { monto: 3000, pagada: false } }),
    ]);
    const res = await pedir();
    expect(res.body[0].estado).toBe('VENCIDO');
    expect(res.body[0].multa).toMatchObject({ monto: 3000, pagada: false });
  });

  test('sin préstamos -> 200 con lista vacía', async () => {
    prestamoRepository.buscarPrestamosPorUsuario.mockResolvedValue([]);
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('historial de otro usuario -> 403', async () => {
    const res = await pedir(999);
    expect(res.status).toBe(403);
  });

  test('un administrador puede ver cualquier historial -> 200', async () => {
    prestamoRepository.buscarPrestamosPorUsuario.mockResolvedValue([]);
    const res = await pedir(2, tokenAdmin);
    expect(res.status).toBe(200);
  });

  test('id inválido -> 400', async () => {
    const res = await pedir('abc');
    expect(res.status).toBe(400);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/usuarios/2/prestamos');
    expect(res.status).toBe(401);
  });
});
