const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');
const { solicitar, devolver, renovar } = require('../controllers/prestamoController');

// Solicitar un préstamo: cualquier usuario autenticado (HU-11).
router.post('/', authMiddleware, solicitar);

// Registrar la devolución: solo el administrador (HU-12).
router.patch('/:id/devolver', authMiddleware, autorizarRol('ADMIN'), devolver);

// Renovar un préstamo propio: el asociado dueño (HU-13).
router.patch('/:id/renovar', authMiddleware, renovar);

module.exports = router;
