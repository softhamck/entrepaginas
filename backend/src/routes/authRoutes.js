const express = require('express');
const router = express.Router();
const { register, login, perfil } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, perfil); // endpoint protegido

module.exports = router;