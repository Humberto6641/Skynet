const db = require('../configurations/db_conf');
const { verifyAdmin } = require('../security/verifier');

const getConfiguracion = async (req, res) => {
    try {
        
        res.json({ message: 'Configuración del sistema' });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la configuración' });
    }
};
//// Solo ADMIN
// Cambiar rol de usuario
const cambiarRolUsuario = async (req, res) => {
    const { id, nuevoRol } = req.body;
    
    if (!id || !nuevoRol) {
        return res.status(400).json({ error: 'ID y nuevo rol son requeridos' });
    }

    try {
        //// Verificar que el usuario existe
        const [usuario] = await db.query('SELECT * FROM usuario WHERE id = ?', [id]);
        if (usuario.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        //// Actualizar el rol del usuario
        await db.query('UPDATE usuario SET rol = ? WHERE id = ?', [nuevoRol, id]);

        res.json({ message: 'Rol actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al cambiar el rol' });
    }
};

module.exports = { getConfiguracion, cambiarRolUsuario };