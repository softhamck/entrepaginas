const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');
const { darBaja } = require('../controllers/ejemplarController');

// Dar de baja un ejemplar: solo el administrador (HU-10).
router.delete('/:id', authMiddleware, autorizarRol('ADMIN'), darBaja);

module.exports = router;
