const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');
const { listar, pagar } = require('../controllers/multaController');

// Gestión de multas: solo el administrador (HU-15).
router.get('/', authMiddleware, autorizarRol('ADMIN'), listar);
router.patch('/:id/pagar', authMiddleware, autorizarRol('ADMIN'), pagar);

module.exports = router;
