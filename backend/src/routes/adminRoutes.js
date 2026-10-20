const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');

// Área de administración, protegida por rol (HU-05).
// Verifica que quien entra sea administrador; es la base para HU-06 (importar inventario).
router.get('/verificacion', authMiddleware, autorizarRol('ADMIN'), (req, res) => {
  res.json({ ok: true, mensaje: 'Acceso de administrador verificado' });
});

module.exports = router;
