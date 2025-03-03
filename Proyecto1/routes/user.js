// routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios'); // Asegúrate de que la ruta sea correcta
const { verifyToken, verifyAdmin } = require('../security/verifier'); // Importar correctamente

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Las variables de entorno de Supabase no están configuradas correctamente.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Obtener todos los técnicos que NO estén asignados a un grupo
// Obtener todos los técnicos que NO estén asignados a un grupo
router.get('/usuarios/tecnicos-disponibles', verifyToken, async (req, res) => {
    try {
        // Obtener todos los técnicos
        const { data: tecnicos, error: errorTecnicos } = await supabase
            .from('usuario')
            .select('id, nombre, correo')
            .eq('rol', 'Técnico');

        if (errorTecnicos) throw new Error('Error al obtener técnicos: ' + errorTecnicos.message);

        // Obtener IDs de técnicos que ya están en algún grupo
        const { data: asignaciones, error: errorAsignaciones } = await supabase
            .from('grupo_tecnico')
            .select('id_tecnico');

        if (errorAsignaciones) throw new Error('Error al obtener asignaciones: ' + errorAsignaciones.message);

        // Extraer solo los IDs de técnicos asignados
        const tecnicosAsignados = asignaciones.map((t) => t.id_tecnico);

        // Filtrar técnicos que NO están en la lista de asignados
        const tecnicosDisponibles = tecnicos.filter((t) => !tecnicosAsignados.includes(t.id));

        res.json(tecnicosDisponibles);
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Ruta para obtener todos los usuarios
router.get('/usuarios', usuariosController.getAllUsers);

// Ruta para obtener un usuario por su ID
router.get('/usuarios/:id', usuariosController.getUserById);

// Ruta para crear un nuevo usuario
router.post('/usuarios', usuariosController.createUser);

// Ruta para actualizar un usuario
router.put('/usuarios/:id', usuariosController.updateUser);

// Ruta para eliminar un usuario
router.delete('/usuarios/:id', usuariosController.deleteUser);

module.exports = router;