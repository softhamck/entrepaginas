const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { historialPrestamos } = require('../controllers/usuarioController');

// Historial de préstamos del asociado (HU-14).
router.get('/:id/prestamos', authMiddleware, historialPrestamos);

module.exports = router;
