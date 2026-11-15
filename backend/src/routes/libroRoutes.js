const express = require('express');
const multer = require('multer');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const autorizarRol = require('../middlewares/rolMiddleware');
const { importar, listar, detalle, actualizar, ejemplares } = require('../controllers/libroController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // máx. 5 MB

// Consultar el catálogo: cualquier usuario autenticado (HU-08).
router.get('/', authMiddleware, listar);

// Detalle de un libro: cualquier usuario autenticado (HU-09).
router.get('/:id', authMiddleware, detalle);

// Ejemplares de un libro: solo el administrador (HU-10).
router.get('/:id/ejemplares', authMiddleware, autorizarRol('ADMIN'), ejemplares);

// Editar un libro: solo el administrador (HU-10).
router.patch('/:id', authMiddleware, autorizarRol('ADMIN'), actualizar);

// Importar inventario: solo el administrador (HU-05 + HU-06).
router.post('/importar', authMiddleware, autorizarRol('ADMIN'), upload.single('archivo'), importar);

module.exports = router;
