const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const libroRoutes = require('./routes/libroRoutes');
const prestamoRoutes = require('./routes/prestamoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const multaRoutes = require('./routes/multaRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const ejemplarRoutes = require('./routes/ejemplarRoutes');
const recomendacionRoutes = require('./routes/recomendacionRoutes');

const app = express();
app.disable('x-powered-by');

const ORIGENES_PERMITIDOS = (process.env.CORS_ORIGINS || 'https://entrepaginas-phi.vercel.app,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());
app.use(cors({ origin: ORIGENES_PERMITIDOS }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/multas', multaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/ejemplares', ejemplarRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Traduce los errores de carga de archivos (Multer) a una respuesta JSON controlada.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ mensaje: 'El archivo supera el tamaño máximo permitido (5 MB).' });
  }
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ mensaje: 'No se pudo procesar el archivo cargado.' });
  }
  return res.status(500).json({ mensaje: 'Ocurrió un error inesperado.' });
});

module.exports = app;
