const express = require('express');
const router = express.Router();
const supabase = require('../configurations/db_conf'); // Conexión a la base de datos
const { verifyToken, verifyAdmin } = require('../security/verifier');// Middleware de verificación JWT

/////////////////
const multer = require('multer');
const storage = multer.memoryStorage(); // Guarda el archivo en memoria antes de subirlo
const upload = multer({ storage: storage });
/////////////////////




// 1. Listar todos los reportes (Supervisor y Admin pueden ver todos los reportes)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { rol } = req.user;  // `req.user` viene del middleware de autenticación (JWT)

    // Solo Supervisor y Admin pueden ver los reportes
    if (rol !== 'Supervisor' && rol !== 'Administrador') {
      return res.status(403).send('Acceso no autorizado');
    }

    const { data, error } = await supabase.from('reporte').select('*');  // Consulta todos los reportes
    if (error) {
      console.error(error.message);
      return res.status(500).send('Error al obtener reportes');
    }

    res.json(data);  // Retorna los reportes encontrados
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error interno del servidor');
  }
});

// 2. Crear un reporte (solo Técnico puede crear reportes)// 2. Crear un reporte con imagen (solo Técnico puede crear reportes)
router.post('/', verifyToken, upload.single('evidencia'), async (req, res) => {
  const { rol } = req.user;
  if (rol !== 'Técnico') {
    return res.status(403).send('Acceso no autorizado');
  }

  const { id_visita, id_tecnico, id_supervisor, horaInicio, horaFin, descripcion, estado } = req.body;
  const file = req.file; // Imagen recibida

  if (!id_visita || !id_tecnico || !id_supervisor || !horaInicio || !horaFin || !descripcion || !estado) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  let imageUrl = null;

  if (file) {
    // Subir la imagen a Supabase Storage
    const { data, error } = await supabase.storage
      .from('evidencias-reportes')  // Nombre del bucket en Supabase
      .upload(`reportes/${Date.now()}-${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error al subir imagen:', error.message);
      return res.status(500).send('Error al subir la imagen');
    }

    // Obtener la URL pública de la imagen
    imageUrl = `https://sdwkbvzymslgkntjhlxz.supabase.co/storage/v1/object/public/evidencias-reportes/${data.path}`;
  }

  try {
    const { data, error } = await supabase
      .from('reporte')
      .insert([{ id_visita, id_tecnico, id_supervisor, horaInicio, horaFin, descripcion, estado, evidencia: imageUrl }])
      .select();

    if (error) {
      console.error(error.message);
      return res.status(500).send('Error al crear reporte');
    }

    res.status(201).json(data[0]); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error interno del servidor');
  }
});



// 4. Eliminar un reporte (solo Admin puede eliminar reportes)
router.delete('/:id',  verifyToken, verifyAdmin, async (req, res) => {
  const { rol } = req.user;  // Verifica el rol del usuario

  // Solo Admin puede eliminar reportes
  if (rol !== 'Administrador') {
    return res.status(403).send('Acceso no autorizado');
  }

  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('reporte')
      .delete()
      .eq('id', id);  // Elimina el reporte con el ID especificado

    if (error) {
      console.error(error.message);
      return res.status(500).send('Error al eliminar reporte');
    }

    res.json({ msg: 'Reporte eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error interno del servidor');
  }
});

/////////////////////////////////////////////////////////Nuevo
// Obtener reportes de un técnico específico
router.get('/tecnico/:id', verifyToken, async (req, res) => {
  const { rol, userId } = req.user; // 🔹 Aquí debe ser userId, como lo vimos en el token
  const id_tecnico = parseInt(req.params.id, 10); // Convertir a número

  if (rol !== "Técnico" || userId !== id_tecnico) {
      return res.status(403).json({ error: "Acceso no autorizado" });
  }

  try {
      const { data, error } = await supabase
          .from('reporte')
          .select('*')
          .eq('id_tecnico', id_tecnico)
          .order('horaInicio', { ascending: false });

      if (error) {
          console.error("Error al obtener reportes:", error.message);
          return res.status(500).json({ error: "Error al obtener reportes" });
      }

      res.json(data);
  } catch (err) {
      console.error("Error en el servidor:", err);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});

////////////////////////////////////////////
// Obtener los reportes de todos los técnicos asignados a un supervisor
router.get('/supervisor/:id_supervisor/reportes', verifyToken, async (req, res) => {
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
          .in('id_grupo', grupos.map(grupo => grupo.id));  // Filtrar por los IDs de los grupos del supervisor

      if (errorTecnicos || !tecnicos || tecnicos.length === 0) {
          return res.status(404).json({ error: 'No se encontraron técnicos asignados a estos grupos.' });
      }

      // Obtener la información de los reportes de todos los técnicos
      const idsTecnicos = tecnicos.map(tecnico => tecnico.id_tecnico);
      const { data: reportes, error: errorReportes } = await supabase
          .from('reporte')
          .select('*')
          .in('id_tecnico', idsTecnicos)  // Filtrar por los IDs de los técnicos
          .order('horaInicio', { ascending: false });

      if (errorReportes || !reportes || reportes.length === 0) {
          return res.status(404).json({ error: 'No se encontraron reportes de los técnicos.' });
      }

      // Devolver la lista de reportes
      res.json(reportes);

  } catch (error) {
      console.error('Error al obtener reportes:', error);
      res.status(500).json({ error: 'Error interno', details: error.message });
  }
});



// Obtener un único reporte por su ID
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
      const { data, error } = await supabase
          .from('reporte')
          .select('*')
          .eq('id', id)
          .single(); // 🔹 Devuelve solo un objeto en lugar de un array

      if (error) {
          console.error("Error al obtener el reporte:", error.message);
          return res.status(500).json({ error: "Error al obtener el reporte" });
      }

      if (!data) {
          return res.status(404).json({ error: "Reporte no encontrado" });
      }

      res.json(data);
  } catch (err) {
      console.error("Error en el servidor:", err);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});



////////////////////////////////////////////////////
// 3. Actualizar un reporte (solo Técnico puede actualizar sus reportes)
router.put('/:id', verifyToken, async (req, res) => {
  const { rol, userId } = req.user; // `userId` es el ID del técnico autenticado
  const { id } = req.params;
  const { horaInicio, horaFin, descripcion, estado, evidencia } = req.body;

  // Validación del campo obligatorio para el técnico
  if (rol === 'Técnico' && !horaInicio && !horaFin && !descripcion && !evidencia) {
    return res.status(400).json({ error: 'Se debe actualizar al menos un campo distinto al estado' });
  }

  // Si el rol es supervisor, el estado sí puede ser modificado
  if (rol === 'Supervisor' && !estado) {
    return res.status(400).json({ error: 'El campo estado es obligatorio para el supervisor' });
  }

  try {
    // Verificar si el reporte pertenece al técnico autenticado
    const { data: reporte, error: errorReporte } = await supabase
      .from('reporte')
      .select('id_tecnico')
      .eq('id', id)
      .single();

    if (errorReporte || !reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    if (reporte.id_tecnico !== userId && rol === 'Técnico') {
      return res.status(403).json({ error: 'No puedes modificar este reporte' });
    }

    // Actualizar el reporte
    const updatedFields = { horaInicio, horaFin, descripcion, estado, evidencia };
    const updateData = {};

    // Si el técnico está modificando, no se modifica el estado
    if (rol === 'Técnico') {
      delete updatedFields.estado;
    }

    // Filtrar solo los campos con valores definidos
    Object.keys(updatedFields).forEach(key => {
      if (updatedFields[key]) {
        updateData[key] = updatedFields[key];
      }
    });

    const { data, error } = await supabase
      .from('reporte')
      .update(updateData)
      .eq('id', id)
      .select(); // Esto devuelve el reporte actualizado

    if (error) {
      console.error(error.message);
      return res.status(500).send('Error al actualizar reporte');
    }

    res.json(data[0]); // Enviar el reporte actualizado
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error interno del servidor');
  }
});
////////////////////////////////////////////////////





module.exports = router;