const express = require('express');
const router = express.Router();
const { getConfiguracion, cambiarRolUsuario } = require('../controllers/configuracion');
const { verifyToken, verifyAdmin } = require('../security/verifier');

// Ruta para obtener la configuración (opcional)
router.get('/', verifyToken, verifyAdmin, getConfiguracion);

// Ruta para cambiar rol de usuario (solo administrador)
router.put('/cambiar-rol', verifyToken, verifyAdmin, cambiarRolUsuario);

module.exports = router;