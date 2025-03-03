const express = require('express');
const router = express.Router();
const supabase = require('../configurations/db_conf');
const { verifyToken, verifyAdmin } = require('../security/verifier');

// Obtener todos los grupos (solo administradores y supervisores pueden verlos)
router.get('/', verifyToken, async (req, res) => {
    if (req.user.rol !== 'Administrador' && req.user.rol !== 'Supervisor') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const { data, error } = await supabase.from('grupo').select('*');
        if (error) return res.status(500).json({ error: 'Error al obtener grupos: ' + error.message });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Obtener un grupo por ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('grupo').select('*').eq('id', req.params.id).single();
        if (error) return res.status(404).json({ error: 'Grupo no encontrado' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Obtener el grupo de un técnico
router.get('/tecnico/:id_tecnico', verifyToken, async (req, res) => {
    try {
        const { id_tecnico } = req.params;

        // Obtner el ID del grupo al que pertenece el tecnico
        const { data: grupo_tecnico, error: errorGT } = await supabase
            .from('grupo_tecnico')
            .select('id_grupo')
            .eq('id_tecnico', id_tecnico)
            .single();

        if (errorGT || !grupo_tecnico) {
            return res.status(404).json({ error: 'El técnico no pertenece a ningún grupo' });
        }

        // Obtener la informacion del grupo
        const { data: grupo, error: errorG } = await supabase
            .from('grupo')
            .select('*')
            .eq('id', grupo_tecnico.id_grupo)
            .single();

        if (errorG || !grupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
///////////////////////////////////////////////////////////7
///
        // Obtener el nombre del supervisor
        const { data: supervisor, error: errorS } = await supabase
            .from('usuario')
            .select('nombre')
            .eq('id', grupo.id_supervisor)
            .single();

        if (errorS || !supervisor) {
            return res.status(404).json({ error: 'Supervisor no encontrado' });
        }

        const resultado = {
            id_grupo: grupo.id,
            nombre_grupo: grupo.nombre,
            descripcion: grupo.descripcion,
            supervisor: supervisor.nombre
        };

        res.json(resultado);

    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Crear un grupo (solo administradores)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    const { nombre, descripcion, id_supervisor } = req.body;
    if (!nombre || !id_supervisor) {
        return res.status(400).json({ error: 'Nombre e ID de supervisor son obligatorios' });
    }

    try {
        const { data, error } = await supabase.from('grupo').insert([{ nombre, descripcion, id_supervisor }]);
        if (error) return res.status(500).json({ error: 'Error al crear grupo: ' + error.message });
        res.status(201).json({ message: 'Grupo creado exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Asignar un técnico a un grupo (solo administradores)
router.post('/:id_grupo/asignar-tecnico', verifyToken, async (req, res) => {
    const { id_tecnico } = req.body;
    const { id_grupo } = req.params;

    try {
        // Verificar que el grupo y el técnico existen
        const { data: grupo, error: errorGrupo } = await supabase
            .from('grupo')
            .select('*')
            .eq('id', id_grupo)
            .single();

        const { data: tecnico, error: errorTecnico } = await supabase
            .from('usuario')
            .select('*')
            .eq('id', id_tecnico)
            .eq('rol', 'Técnico')
            .single();

        if (errorGrupo || !grupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
        if (errorTecnico || !tecnico) {
            return res.status(404).json({ error: 'Técnico no encontrado o no es técnico' });
        }

        // Verificar que el técnico no esté ya en el grupo
        const { data: existe, error: errorExiste } = await supabase
        .from('grupo_tecnico')
        .select('*')
        .eq('id_grupo', id_grupo)
        .eq('id_tecnico', id_tecnico)
        .maybeSingle(); 
    
    if (existe) { 
        return res.status(400).json({ error: 'El técnico ya está asignado a este grupo' });
    }

        // Insertar en la tabla intermedia grupo_tecnico
        await supabase
            .from('grupo_tecnico')
            .insert({ id_grupo, id_tecnico });

        res.json({ mensaje: 'Técnico asignado correctamente' });

    } catch (error) {
        console.error('Error al asignar técnico:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar un grupo (solo administradores)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { nombre, descripcion, id_supervisor } = req.body;
    const updatedFields = {};

    if (nombre) updatedFields.nombre = nombre;
    if (descripcion) updatedFields.descripcion = descripcion;
    if (id_supervisor) updatedFields.id_supervisor = id_supervisor;

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const { data, error } = await supabase.from('grupo').update(updatedFields).eq('id', req.params.id);
        if (error) return res.status(500).json({ error: 'Error al actualizar grupo: ' + error.message });
        res.json({ message: 'Grupo actualizado exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});

// Eliminar un grupo (solo administradores)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('grupo').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ error: 'Error al eliminar grupo: ' + error.message });
        res.json({ message: 'Grupo eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});



router.post('/:id/asignar-tecnico', async (req, res) => {
    const { id } = req.params; 
    const { id_tecnico } = req.body; 

    try {
        
        const { data: existente, error: errorExistente } = await supabase
            .from('grupo_tecnico')
            .select('*')
            .eq('id_grupo', id)
            .eq('id_tecnico', id_tecnico);

        if (errorExistente) throw errorExistente;

        if (existente.length > 0) {
            return res.status(400).json({ message: 'El técnico ya está asignado a este grupo' });
        }

        
        const { error } = await supabase
            .from('grupo_tecnico')
            .insert([{ id_grupo: id, id_tecnico }]);

        if (error) throw error;

        res.json({ message: 'Técnico asignado correctamente' });
    } catch (error) {
        console.error('Error en POST /grupos/:id/asignar-tecnico:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});


///////////////////Tecnicos sin grupo
// Obtener técnicos disponibles para un grupo específico
router.get('/:id/tecnicos-disponibles', verifyToken, async (req, res) => {
    const grupoId = req.params.id;
    console.log('Grupo ID recibido en el backend:', grupoId);

    try {
        
        const { data: grupoTecnicos, error: grupoError } = await supabase
            .from('grupo_tecnico')
            .select('id_tecnico')
            .eq('id_grupo', grupoId);

        if (grupoError) {
            console.log('Error al obtener los técnicos del grupo:', grupoError);
            return res.status(500).json({ error: 'Error al obtener técnicos del grupo', details: grupoError.message });
        }

      
        const idsTecnicosAsignados = grupoTecnicos.map(tecnico => tecnico.id_tecnico);
        console.log('IDs de técnicos asignados:', idsTecnicosAsignados);

        
        const { data: todosTecnicos, error: todosError } = await supabase
            .from('usuario')
            .select('*')
            .eq('rol', 'Técnico'); 

        if (todosError) {
            console.log('Error al obtener todos los técnicos:', todosError);
            return res.status(500).json({ error: 'Error al obtener todos los técnicos', details: todosError.message });
        }

        const tecnicosDisponibles = todosTecnicos.filter(tecnico => 
            !idsTecnicosAsignados.includes(tecnico.id));

        console.log('Técnicos disponibles:', tecnicosDisponibles);

    
        return res.json(tecnicosDisponibles);

    } catch (error) {
        console.error('Error interno:', error);
        return res.status(500).json({ error: 'Error interno', details: error.message });
    }
});











//////////////////////////////////////////////////
// Obtener los técnicos asignados a un supervisor
router.get('/supervisor/:id_supervisor/tecnicos', verifyToken, async (req, res) => {
    const { id_supervisor } = req.params;  

    try {
        // Obtener los grupos que tienen al supervisor especificado
        const { data: grupos, error: errorGrupos } = await supabase
            .from('grupo')
            .select('id')
            .eq('id_supervisor', id_supervisor);

        if (errorGrupos || !grupos || grupos.length === 0) {
            return res.status(404).json({ error: 'No se encontraron grupos para este supervisor.' });
        }

        // Obtener los técnicos asignados a estos grupos
        const { data: tecnicos, error: errorTecnicos } = await supabase
            .from('grupo_tecnico')
            .select('id_tecnico')
            .in('id_grupo', grupos.map(grupo => grupo.id));  

        if (errorTecnicos || !tecnicos || tecnicos.length === 0) {
            return res.status(404).json({ error: 'No se encontraron técnicos asignados a estos grupos.' });
        }

        // Obtener la información de los técnicos
        const idsTecnicos = tecnicos.map(tecnico => tecnico.id_tecnico);  
        const { data: usuarios, error: errorUsuarios } = await supabase
            .from('usuario')
            .select('id, nombre')
            .in('id', idsTecnicos)  
            .eq('rol', 'Técnico');  

        if (errorUsuarios || !usuarios || usuarios.length === 0) {
            return res.status(404).json({ error: 'No se encontraron técnicos con los ID proporcionados.' });
        }

        // Devolver la lista de técnicos
        res.json(usuarios);

    } catch (error) {
        console.error('Error al obtener técnicos:', error);
        res.status(500).json({ error: 'Error interno', details: error.message });
    }
});


//////////////////////////////////////////
// Obtener los técnicos de un grupo específico
router.get('/:id/tecnicos', async (req, res) => {
    const { id } = req.params; 

    try {
       
        const { data: tecnicosGrupo, error: errorGrupo } = await supabase
            .from('grupo_tecnico')
            .select('id_tecnico')
            .eq('id_grupo', id);

        if (errorGrupo) throw errorGrupo; 

        if (!tecnicosGrupo.length) {
            return res.status(404).json({ message: 'No hay técnicos asignados a este grupo' });
        }

    
        const idsTecnicos = tecnicosGrupo.map(t => t.id_tecnico);

        
        const { data: tecnicos, error: errorUsuarios } = await supabase
            .from('usuario')
            .select('id, nombre, correo')
            .in('id', idsTecnicos); 

        if (errorUsuarios) throw errorUsuarios;

        res.json(tecnicos);
    } catch (error) {
        console.error('Error en GET /grupos/:id/tecnicos:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});


router.delete('/:grupoId/quitar-tecnico/:tecnicoId',async (req, res) => { 
    const { grupoId, tecnicoId } = req.params;

    console.log("Eliminando técnico:", { grupoId, tecnicoId });

    if (!grupoId || !tecnicoId) {
        return res.status(400).json({ error: "Se requieren grupoId y tecnicoId" });
    }

    try {
        ///////No usar
        //supabase.from('grupo_tecnico').delete() en lugar de supabase.query
        const { error } = await supabase
            .from('grupo_tecnico')
            .delete()
            .eq('id_grupo', grupoId)
            .eq('id_tecnico', tecnicoId);

        if (error) {
            throw error;
        }

        res.json({ mensaje: "Técnico eliminado del grupo correctamente" });
    } catch (error) {
        console.error("Error al quitar técnico del grupo:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});








module.exports = router;