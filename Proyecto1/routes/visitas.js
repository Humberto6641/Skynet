const express = require('express');
const router = express.Router();
const supabase = require('../configurations/db_conf');
const { verifyToken, verifyAdmin } = require('../security/verifier'); // Importar correctamente

// Obtener todas las visitas (solo administradores y supervisores)
router.get('/', verifyToken, async (req, res) => {
    if (req.user.rol !== 'Administrador' && req.user.rol !== 'Supervisor') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const { data, error } = await supabase.from('visita').select('*');
        if (error) return res.status(500).json({ error: 'Error al obtener visitas: ' + error.message });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Obtener una visita por ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('visita').select('*').eq('id', req.params.id).single();
        if (error) return res.status(404).json({ error: 'Visita no encontrada' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Obtener visitas asignadas a un técnico específico
router.get('/tecnico/:id_tecnico', verifyToken, async (req, res) => {
    const id_tecnico = req.params.id_tecnico;

    // Solo el propio técnico o un administrador/supervisor pueden ver las visitas
    if (req.user.rol === 'Técnico' && req.user.userId != id_tecnico) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const { data, error } = await supabase.from('visita').select('*').eq('id_tecnico', id_tecnico);
        if (error) return res.status(500).json({ error: 'Error al obtener visitas: ' + error.message });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Crear una visita (solo administradores y supervisores)
router.post('/', verifyToken, async (req, res) => {
    if (req.user.rol !== 'Administrador' && req.user.rol !== 'Supervisor') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id_cliente, id_tecnico, id_supervisor, motivo, tipo_servicio, fecha, ubicacion, estado, observaciones } = req.body;
    if (!id_cliente || !id_tecnico || !id_supervisor || !fecha) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    try {
        const { data, error } = await supabase.from('visita').insert([{ id_cliente, id_tecnico, id_supervisor, motivo, tipo_servicio, fecha, ubicacion, estado, observaciones }]);
        if (error) return res.status(500).json({ error: 'Error al crear visita: ' + error.message });
        res.status(201).json({ message: 'Visita creada exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Actualizar una visita (solo administradores y supervisores)
router.put('/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'Administrador' && req.user.rol !== 'Supervisor') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id_cliente, id_tecnico, id_supervisor, motivo, tipo_servicio, fecha, ubicacion, estado, observaciones } = req.body;
    const updatedFields = {};

    if (id_cliente) updatedFields.id_cliente = id_cliente;
    if (id_tecnico) updatedFields.id_tecnico = id_tecnico;
    if (id_supervisor) updatedFields.id_supervisor = id_supervisor;
    if (motivo) updatedFields.motivo = motivo;
    if (tipo_servicio) updatedFields.tipo_servicio = tipo_servicio;
    if (fecha) updatedFields.fecha = fecha;
    if (ubicacion) updatedFields.ubicacion = ubicacion;
    if (estado) updatedFields.estado = estado;
    if (observaciones) updatedFields.observaciones = observaciones;

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const { data, error } = await supabase.from('visita').update(updatedFields).eq('id', req.params.id);
        if (error) return res.status(500).json({ error: 'Error al actualizar visita: ' + error.message });
        res.json({ message: 'Visita actualizada exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Eliminar una visita (solo administradores)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('visita').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ error: 'Error al eliminar visita: ' + error.message });
        res.json({ message: 'Visita eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

module.exports = router;