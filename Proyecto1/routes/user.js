// routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios'); 
const { verifyToken, verifyAdmin } = require('../security/verifier'); 

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Las variables de entorno de Supabase no están configuradas correctamente.");
}

const supabase = createClient(supabaseUrl, supabaseKey);


// Obtener todos los técnicos que NO estén asignados a un grupo
router.get('/usuarios/tecnicos-disponibles', verifyToken, async (req, res) => {
    try {
        
        const { data: tecnicos, error: errorTecnicos } = await supabase
            .from('usuario')
            .select('id, nombre, correo')
            .eq('rol', 'Técnico');

        if (errorTecnicos) throw new Error('Error al obtener técnicos: ' + errorTecnicos.message);

       
        const { data: asignaciones, error: errorAsignaciones } = await supabase
            .from('grupo_tecnico')
            .select('id_tecnico');

        if (errorAsignaciones) throw new Error('Error al obtener asignaciones: ' + errorAsignaciones.message);

        
        const tecnicosAsignados = asignaciones.map((t) => t.id_tecnico);

        
        const tecnicosDisponibles = tecnicos.filter((t) => !tecnicosAsignados.includes(t.id));

        res.json(tecnicosDisponibles);
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// todos los usuarios
router.get('/usuarios', usuariosController.getAllUsers);

// obtener un usuario por su ID
router.get('/usuarios/:id', usuariosController.getUserById);

//ruta para crear un nuevo usuario
router.post('/usuarios', usuariosController.createUser);

// ruta para actualizar un usuario
router.put('/usuarios/:id', usuariosController.updateUser);

//  eliminar un usuario
router.delete('/usuarios/:id', usuariosController.deleteUser);

module.exports = router;