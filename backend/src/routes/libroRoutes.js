const express = require('express');
const multer = require('multer');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');
const { importar } = require('../controllers/libroController');

// El archivo se recibe en memoria (no se guarda en disco).
const upload = multer({ storage: multer.memoryStorage() });

// Importar inventario: solo el administrador (HU-05 + HU-06).
router.post('/importar', authMiddleware, autorizarRol('ADMIN'), upload.single('archivo'), importar);

module.exports = router;
