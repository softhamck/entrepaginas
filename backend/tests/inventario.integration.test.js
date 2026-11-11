process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/libroRepository', () => ({
  buscarLibroPorTituloAutor: jest.fn(),
  crearLibro: jest.fn(),
  buscarEjemplarPorCodigo: jest.fn(),
  crearEjemplar: jest.fn(),
  buscarLibros: jest.fn(),
  buscarLibroPorId: jest.fn(),
  actualizarLibro: jest.fn(),
  buscarEjemplarPorId: jest.fn(),
  contarPrestamosDeEjemplar: jest.fn(),
  darDeBajaEjemplar: jest.fn(),
  eliminarEjemplar: jest.fn(),
}));

const libroRepository = require('../src/repositories/libroRepository');
const app = require('../src/app');

const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });
const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

describe('Gestión de inventario (HU-10)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('PATCH /api/libros/:id (editar)', () => {
    beforeEach(() => {
      libroRepository.buscarLibroPorId.mockResolvedValue({ id: 1, titulo: 'Viejo', autor: 'X' });
      libroRepository.actualizarLibro.mockImplementation((id, data) => Promise.resolve({ id, ...data }));
    });
    const editar = (body, token = tokenAdmin) =>
      request(app).patch('/api/libros/1').set('Authorization', `Bearer ${token}`).send(body);

    test('editar exitoso -> 200 "Cambios guardados"', async () => {
      const res = await editar({ titulo: 'Nuevo título', categoria: 'Novela' });
      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Cambios guardados');
      expect(libroRepository.actualizarLibro).toHaveBeenCalledWith(1,
        expect.objectContaining({ titulo: 'Nuevo título', categoria: 'Novela' }));
    });

    test('libro inexistente -> 404', async () => {
      libroRepository.buscarLibroPorId.mockResolvedValue(null);
      const res = await editar({ titulo: 'X' });
      expect(res.status).toBe(404);
    });

    test('título vacío -> 409', async () => {
      const res = await editar({ titulo: '  ' });
      expect(res.status).toBe(409);
    });

    test('un asociado no puede editar -> 403', async () => {
      const res = await editar({ titulo: 'X' }, tokenUsuario);
      expect(res.status).toBe(403);
    });

    test('sin sesión -> 401', async () => {
      const res = await request(app).patch('/api/libros/1').send({ titulo: 'X' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/ejemplares/:id (baja)', () => {
    const baja = (id = 5, token = tokenAdmin) =>
      request(app).delete(`/api/ejemplares/${id}`).set('Authorization', `Bearer ${token}`);

    test('ejemplar con historial -> baja lógica (BAJA)', async () => {
      libroRepository.buscarEjemplarPorId.mockResolvedValue({ id: 5, estado: 'DISPONIBLE' });
      libroRepository.contarPrestamosDeEjemplar.mockResolvedValue(3);
      libroRepository.darDeBajaEjemplar.mockResolvedValue({ id: 5, estado: 'BAJA' });
      const res = await baja();
      expect(res.status).toBe(200);
      expect(res.body.accion).toBe('BAJA_LOGICA');
      expect(libroRepository.darDeBajaEjemplar).toHaveBeenCalledWith(5);
      expect(libroRepository.eliminarEjemplar).not.toHaveBeenCalled();
    });

    test('ejemplar sin historial -> eliminación física', async () => {
      libroRepository.buscarEjemplarPorId.mockResolvedValue({ id: 5, estado: 'DISPONIBLE' });
      libroRepository.contarPrestamosDeEjemplar.mockResolvedValue(0);
      libroRepository.eliminarEjemplar.mockResolvedValue({ id: 5 });
      const res = await baja();
      expect(res.status).toBe(200);
      expect(res.body.accion).toBe('ELIMINADO');
      expect(libroRepository.eliminarEjemplar).toHaveBeenCalledWith(5);
      expect(libroRepository.darDeBajaEjemplar).not.toHaveBeenCalled();
    });

    test('ejemplar prestado -> 409', async () => {
      libroRepository.buscarEjemplarPorId.mockResolvedValue({ id: 5, estado: 'PRESTADO' });
      const res = await baja();
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/prestado/i);
    });

    test('ejemplar ya en baja -> 409', async () => {
      libroRepository.buscarEjemplarPorId.mockResolvedValue({ id: 5, estado: 'BAJA' });
      const res = await baja();
      expect(res.status).toBe(409);
    });

    test('ejemplar inexistente -> 404', async () => {
      libroRepository.buscarEjemplarPorId.mockResolvedValue(null);
      const res = await baja(999);
      expect(res.status).toBe(404);
    });

    test('un asociado no puede dar de baja -> 403', async () => {
      const res = await baja(5, tokenUsuario);
      expect(res.status).toBe(403);
    });

    test('sin sesión -> 401', async () => {
      const res = await request(app).delete('/api/ejemplares/5');
      expect(res.status).toBe(401);
    });
  });
});
