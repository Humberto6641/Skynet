const jwt = require('jsonwebtoken');
const supabase = require('../configurations/db_conf'); // Usar Supabase en vez de MySQL

// Middleware para verificar el token y obtener el rol desde la base de datos
const verifyToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Acceso denegado. Token no proporcionado o mal formado' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded);
        const userId = parseInt(decoded.id);
        req.user = decoded; // Guardar los datos decodificados en req.user
        
        // Consultar el rol del usuario desde la base de datos
        const { data, error } = await supabase
            .from('usuario')
            .select('rol')
            .eq('id',decoded.userId)
            .single();
            console.log('Supabase Response:', data, error); 

        if (error || !data) {
            return res.status(403).json({ error: 'Usuario no encontrado o sin permisos' });
        }

        req.user.rol = data.rol; // Asignar el rol obtenido al usuario en la request
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar si el usuario es administrador
const verifyAdmin = (req, res, next) => {
    if (req.user.rol !== 'Administrador') {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden realizar esta acción.' });
    }
    next();
};

module.exports = { verifyToken, verifyAdmin };