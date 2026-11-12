const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { listar } = require('../controllers/recomendacionController');

// Recomendaciones "Para ti": cualquier usuario autenticado (SC-001).
router.get('/', authMiddleware, listar);

module.exports = router;
