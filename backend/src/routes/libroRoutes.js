const express = require('express');
const multer = require('multer');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');
const { importar, listar, detalle } = require('../controllers/libroController');

const upload = multer({ storage: multer.memoryStorage() });

// Consultar el catálogo: cualquier usuario autenticado (HU-08).
router.get('/', authMiddleware, listar);

// Detalle de un libro: cualquier usuario autenticado (HU-09).
router.get('/:id', authMiddleware, detalle);

// Importar inventario: solo el administrador (HU-05 + HU-06).
router.post('/importar', authMiddleware, autorizarRol('ADMIN'), upload.single('archivo'), importar);

module.exports = router;
