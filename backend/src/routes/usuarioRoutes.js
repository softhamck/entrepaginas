const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { historialPrestamos, cambiarConsentimiento, bloqueo } = require('../controllers/usuarioController');

// Historial de préstamos del asociado (HU-14).
router.get('/:id/prestamos', authMiddleware, historialPrestamos);

// Activar o revocar el consentimiento de recomendaciones (SC-001).
router.patch('/:id/consentimiento', authMiddleware, cambiarConsentimiento);

// Estado de bloqueo por multa (HU-17).
router.get('/:id/bloqueo', authMiddleware, bloqueo);

module.exports = router;
