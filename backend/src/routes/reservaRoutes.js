const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { crear, listar } = require('../controllers/reservaController');

// Unirse a la cola de espera y ver las propias reservas (HU-18).
router.post('/', authMiddleware, crear);
router.get('/', authMiddleware, listar);

module.exports = router;
