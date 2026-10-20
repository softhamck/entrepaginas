process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

// Mocks: evitan tocar Prisma.
jest.mock('../src/repositories/usuarioRepository', () => ({
  buscarPorCorreo: jest.fn(), crear: jest.fn(),
}));
jest.mock('../src/repositories/libroRepository', () => ({
  buscarLibroPorTituloAutor: jest.fn(),
  crearLibro: jest.fn(),
  buscarEjemplarPorCodigo: jest.fn(),
  crearEjemplar: jest.fn(),
}));

const libroRepository = require('../src/repositories/libroRepository');
const app = require('../src/app');

const tokenAdmin = jwt.sign({ id: 1, rol: 'ADMIN' }, 'test-secret', { expiresIn: '2h' });
const tokenUsuario = jwt.sign({ id: 2, rol: 'USUARIO' }, 'test-secret', { expiresIn: '2h' });

// Genera un Excel real en memoria a partir de filas (claves = encabezados del archivo).
function excel(filas) {
  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const FILA = (over = {}) => ({
  'Título': 'El demonio en la proa', 'Signatura': 'C863.5 C697de',
  'Código': '82931686', 'Costo': '$ 35.000', 'Autor': 'John Doe',
  'Descripción': 'Novela', 'Categoría': 'Novela', ...over,
});

describe('Importar inventario (HU-06) - POST /api/libros/importar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    libroRepository.buscarEjemplarPorCodigo.mockResolvedValue(null);
    libroRepository.buscarLibroPorTituloAutor.mockResolvedValue(null);
    libroRepository.crearLibro.mockImplementation((d) => Promise.resolve({ id: 10, ...d }));
    libroRepository.crearEjemplar.mockResolvedValue({ id: 99 });
  });

  test('carga exitosa -> 201 con conteo de agregados', async () => {
    const buffer = excel([FILA({ 'Código': '1' }), FILA({ 'Código': '2' })]);
    const res = await request(app).post('/api/libros/importar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('archivo', buffer, 'inventario.xlsx');
    expect(res.status).toBe(201);
    expect(res.body.agregados).toBe(2);
    expect(res.body.omitidos).toHaveLength(0);
  });

  test('filas con error (Código vacío) -> se omiten y se reportan', async () => {
    const buffer = excel([FILA({ 'Código': '3' }), FILA({ 'Código': '' })]);
    const res = await request(app).post('/api/libros/importar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('archivo', buffer, 'inventario.xlsx');
    expect(res.status).toBe(201);
    expect(res.body.agregados).toBe(1);
    expect(res.body.omitidos).toHaveLength(1);
    expect(res.body.omitidos[0].motivo).toMatch(/vac/i);
  });

  test('código ya registrado -> se omite', async () => {
    libroRepository.buscarEjemplarPorCodigo.mockImplementation((c) =>
      Promise.resolve(c === '82931686' ? { id: 5, codigo: c } : null));
    const buffer = excel([FILA({ 'Código': '82931686' })]);
    const res = await request(app).post('/api/libros/importar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('archivo', buffer, 'inventario.xlsx');
    expect(res.status).toBe(201);
    expect(res.body.agregados).toBe(0);
    expect(res.body.omitidos[0].motivo).toMatch(/registrado/i);
  });

  test('formato no válido (.txt) -> 400', async () => {
    const res = await request(app).post('/api/libros/importar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('archivo', Buffer.from('hola'), 'datos.txt');
    expect(res.status).toBe(400);
  });

  test('sin archivo -> 400', async () => {
    const res = await request(app).post('/api/libros/importar')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(400);
  });

  test('un asociado no puede importar -> 403', async () => {
    const buffer = excel([FILA()]);
    const res = await request(app).post('/api/libros/importar')
      .set('Authorization', `Bearer ${tokenUsuario}`)
      .attach('archivo', buffer, 'inventario.xlsx');
    expect(res.status).toBe(403);
  });

  test('sin sesión -> 401', async () => {
    const buffer = excel([FILA()]);
    const res = await request(app).post('/api/libros/importar')
      .attach('archivo', buffer, 'inventario.xlsx');
    expect(res.status).toBe(401);
  });

  test('columnas de préstamo presentes -> se ignoran, igual importa', async () => {
    const fila = FILA({ 'Código': '7', 'Cédula Asociado': '123', 'Nombre': 'Ana', 'Correo': 'a@a.com' });
    const res = await request(app).post('/api/libros/importar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('archivo', excel([fila]), 'inventario.xlsx');
    expect(res.status).toBe(201);
    expect(res.body.agregados).toBe(1);
    expect(libroRepository.crearEjemplar).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: '7' }));
  });
});
