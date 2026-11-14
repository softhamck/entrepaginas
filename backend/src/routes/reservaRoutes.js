const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');
const { crear, listar, colas } = require('../controllers/reservaController');

// Ver todas las colas de espera: solo el administrador (HU-18).
router.get('/colas', authMiddleware, autorizarRol('ADMIN'), colas);

// Unirse a la cola de espera y ver las propias reservas (HU-18).
router.post('/', authMiddleware, crear);
router.get('/', authMiddleware, listar);

module.exports = router;
