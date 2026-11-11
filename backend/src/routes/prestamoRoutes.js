const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { solicitar } = require('../controllers/prestamoController');

// Solicitar un préstamo: cualquier usuario autenticado (HU-11).
router.post('/', authMiddleware, solicitar);

module.exports = router;
