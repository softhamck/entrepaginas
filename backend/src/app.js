const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const libroRoutes = require('./routes/libroRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/libros', libroRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
