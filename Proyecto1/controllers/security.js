const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../configurations/db_conf');  

const login = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    try {
        console.log(`Intentando login con: ${correo}`);  

        // Buscar usuario en la base de datos
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('correo', correo)
            .single();

        if (error) {
            console.error('Error en la consulta de usuario:', error.message);
            return res.status(500).json({ error: 'Error interno al buscar usuario' });
        }

        if (!data) {
            console.log(`Usuario con correo ${correo} no encontrado`);
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        console.log('Usuario encontrado:', data);

        // Comparar contraseñas
        const validPassword = await bcrypt.compare(password, data.password);
        if (!validPassword) {
            console.log('Contraseña incorrecta para el usuario:', correo);
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        console.log('Autenticación exitosa');

        ////// Generar el token//////////////
        const token = jwt.sign({ userId: data.id, rol: data.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.json({ token });
    } catch (error) {
        console.error('Error en la autenticación:', error);
        return res.status(500).json({ error: 'Error en la autenticación', details: error.message });
    }
};

module.exports = { login };