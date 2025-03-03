const express = require('express');
const router = express.Router();
const supabase = require('../configurations/db_conf');
const { verifyToken } = require('../security/verifier'); 

// permisos de Administrador y Supervisor
const checkAdminOrSupervisor = (req, res, next) => {
    const rolesPermitidos = ['Administrador', 'Supervisor'];
    if (!rolesPermitidos.includes(req.user.rol)) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
};

// Obener todos los clientes
router.get('/', verifyToken, checkAdminOrSupervisor, async (req, res) => {
    const { nombre, correo, fecha_registro } = req.query; 
    let query = supabase.from('cliente').select('*');

    if (nombre) query = query.ilike('nombre', `%${nombre}%`);
    if (correo) query = query.eq('correo', correo);
    if (fecha_registro) query = query.gte('fecha_registro', fecha_registro);

    try {
        const { data, error } = await query;
        if (error) {
            return res.status(500).json({ error: 'Error al obtener clientes: ' + error.message });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
    }
});

// Obtener un cliente por ID
router.get('/:id', verifyToken, checkAdminOrSupervisor, async (req, res) => {
    try {
        const { data, error } = await supabase.from('cliente').select('*').eq('id', req.params.id).single();
        if (error) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
    }
});

// Crear un nuevo cliente
router.post('/', verifyToken, checkAdminOrSupervisor, async (req, res) => {
    console.log("Datos recibidos en el servidor:", req.body); 

    const { nombre, correo, telefono, direccion, ubicacion } = req.body;

    if (!ubicacion || !ubicacion.lat || !ubicacion.lng) {
        console.error("Ubicación no recibida o incorrecta:", ubicacion);
        return res.status(400).json({ error: "Las coordenadas son requeridas." });
    }

    const { lat, lng } = ubicacion;

    try {
        const { data, error } = await supabase
            .from('cliente')
            .insert([{
                nombre,
                correo,
                telefono,
                direccion,
                ubicacion: JSON.stringify({ lat, lng }), // Guardar como JSON en la BD
                fecha_registro: new Date()
            }]);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json(data);
    } catch (err) {
        console.error("Error al agregar cliente:", err);
        return res.status(500).json({ error: "Error al agregar cliente" });
    }
});



//*/ Actualizar un cliente
router.put('/:id', verifyToken, checkAdminOrSupervisor, async (req, res) => {
    const { nombre, direccion, ubicacion, telefono, correo } = req.body;
    const updatedFields = {};

    if (nombre) updatedFields.nombre = nombre;
    if (direccion) updatedFields.direccion = direccion;
    if (ubicacion) updatedFields.ubicacion = ubicacion;
    if (telefono) updatedFields.telefono = telefono;
    if (correo) updatedFields.correo = correo;

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const { data, error } = await supabase.from('cliente').update(updatedFields).eq('id', req.params.id);
        if (error) {
            return res.status(500).json({ error: 'Error al actualizar cliente: ' + error.message });
        }
        res.json({ message: 'Cliente actualizado exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cliente', details: error.message });
    }
});

// Eliminar un cliente
router.delete('/:id', verifyToken, checkAdminOrSupervisor, async (req, res) => {
    try {
        const { error } = await supabase.from('cliente').delete().eq('id', req.params.id);
        if (error) {
            return res.status(500).json({ error: 'Error al eliminar cliente: ' + error.message });
        }
        res.json({ message: 'Cliente eliminando exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cliente', details: error.message });
    }
});

module.exports = router;