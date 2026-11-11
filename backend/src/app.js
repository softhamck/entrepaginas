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

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/multas', multaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/ejemplares', ejemplarRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
