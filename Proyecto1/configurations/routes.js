//const { login } = require('../controllers/security');
// routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { login } = require('../controllers/security');
const { checkAdmin } = require('../configurations/accessControl'); // Usar checkAdmin desde accessControl

const usuariosController = require('../controllers/usuarios');

const verifier = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
   
    if (!token) {
        console.log('Token', token);
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        console.log('Usuario decodificado:', req.user);
        next(); 
    } catch (error) {
        console.log('Error en la verificación del token:', error);
        return res.status(403).json({ error: 'Token no válido' });
    }
};

// Ruta de login
router.post('/login', login);

// Rutas para usuarios (registrar, actualizar, eliminar)
console.log('Configurando rutas de usuario...');
router.get('/usuarios', verifier, checkAdmin, usuariosController.getAllUsers);  
console.log('Ruta para obtener todos los usuarios configurada');
router.get('/usuarios/:id', verifier, checkAdmin, usuariosController.getUserById);  
console.log('Ruta para obtener usuario por ID configurada');
router.post('/usuarios', verifier, checkAdmin, usuariosController.createUser);  
console.log('Ruta para crear usuario configurada');
router.put('/usuarios/:id', verifier, checkAdmin, usuariosController.updateUser);  
console.log('Ruta para actualizar usuario configurada');
router.delete('/usuarios/:id', verifier, checkAdmin, usuariosController.deleteUser);  
console.log('Ruta para eliminar usuario configurada');

module.exports = router;