process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/repositories/usuarioRepository', () => ({
  buscarPorCorreo: jest.fn(),
  crear: jest.fn(),
  buscarPorId: jest.fn(),
  actualizarConsentimiento: jest.fn(),
}));
jest.mock('../src/repositories/recomendacionRepository', () => ({
  prestamosConCategoria: jest.fn(),
  librosRecomendables: jest.fn(),
}));

const usuarioRepository = require('../src/repositories/usuarioRepository');
const recomendacionRepository = require('../src/repositories/recomendacionRepository');
const app = require('../src/app');

const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

function prestamos(categoria, cantidad, desdeId = 1) {
  return Array.from({ length: cantidad }, (_, i) => ({
    ejemplar: { libro: { id: desdeId + i, categoria } },
  }));
}

describe('Recomendaciones "Para ti" (SC-001) - GET /api/recomendaciones', () => {
  beforeEach(() => jest.clearAllMocks());
  const pedir = (token = tokenUsuario) =>
    request(app).get('/api/recomendaciones').set('Authorization', `Bearer ${token}`);

  // Esc. 4 / sección 7
  test('sin consentimiento -> no recomienda y lo indica', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({ id: 2, consentimiento: false });
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.body.habilitado).toBe(false);
    expect(res.body.motivo).toBe('sin_consentimiento');
    expect(recomendacionRepository.prestamosConCategoria).not.toHaveBeenCalled();
  });

  // Esc. 2 / 4.1 AC-1
  test('con consentimiento pero <3 préstamos -> historial insuficiente', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({ id: 2, consentimiento: true });
    recomendacionRepository.prestamosConCategoria.mockResolvedValue(prestamos('Novela', 2));
    const res = await pedir();
    expect(res.body.habilitado).toBe(false);
    expect(res.body.motivo).toBe('historial_insuficiente');
  });

  // Esc. 1 + GR-1/GR-3/GR-4
  test('con consentimiento y >=3 préstamos -> recomienda por género con motivo (GR-4) y excluye leídos (GR-1/GR-3)', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({ id: 2, consentimiento: true });
    recomendacionRepository.prestamosConCategoria.mockResolvedValue(prestamos('Novela histórica', 3, 1));
    recomendacionRepository.librosRecomendables.mockResolvedValue([
      { id: 50, titulo: 'El nombre de la rosa', autor: 'Eco', categoria: 'Novela histórica' },
    ]);
    const res = await pedir();
    expect(res.status).toBe(200);
    expect(res.body.habilitado).toBe(true);
    expect(res.body.recomendaciones[0]).toMatchObject({
      titulo: 'El nombre de la rosa', motivo: 'Porque has leído Novela histórica',
    });
    const arg = recomendacionRepository.librosRecomendables.mock.calls[0][0];
    expect(arg.excluirLibroIds.sort()).toEqual([1, 2, 3]);
    expect(arg.categorias).toContain('Novela histórica');
  });

  // Esc. 5
  test('ya leyó todo lo de sus géneros -> habilitado pero sin recomendaciones nuevas', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({ id: 2, consentimiento: true });
    recomendacionRepository.prestamosConCategoria.mockResolvedValue(prestamos('Novela', 3));
    recomendacionRepository.librosRecomendables.mockResolvedValue([]);
    const res = await pedir();
    expect(res.body.habilitado).toBe(true);
    expect(res.body.recomendaciones).toEqual([]);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).get('/api/recomendaciones');
    expect(res.status).toBe(401);
  });
});

describe('Consentimiento (SC-001) - PATCH /api/usuarios/:id/consentimiento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usuarioRepository.actualizarConsentimiento.mockResolvedValue({ id: 2, consentimiento: true });
  });
  const cambiar = (id, body, token = tokenUsuario) =>
    request(app).patch(`/api/usuarios/${id}/consentimiento`).set('Authorization', `Bearer ${token}`).send(body);

  test('activar el propio consentimiento -> 200', async () => {
    const res = await cambiar(2, { consentimiento: true });
    expect(res.status).toBe(200);
    expect(res.body.consentimiento).toBe(true);
    expect(usuarioRepository.actualizarConsentimiento).toHaveBeenCalledWith(2, true);
  });

  test('revocar el propio consentimiento -> 200', async () => {
    usuarioRepository.actualizarConsentimiento.mockResolvedValue({ id: 2, consentimiento: false });
    const res = await cambiar(2, { consentimiento: false });
    expect(res.status).toBe(200);
    expect(res.body.consentimiento).toBe(false);
  });

  test('cambiar el de otro usuario -> 403', async () => {
    const res = await cambiar(999, { consentimiento: true });
    expect(res.status).toBe(403);
  });

  test('valor no booleano -> 400', async () => {
    const res = await cambiar(2, { consentimiento: 'si' });
    expect(res.status).toBe(400);
  });

  test('sin sesión -> 401', async () => {
    const res = await request(app).patch('/api/usuarios/2/consentimiento').send({ consentimiento: true });
    expect(res.status).toBe(401);
  });
});
