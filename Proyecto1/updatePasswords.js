// updatePasswords.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const supabase = require('./configurations/db_conf'); // Asegúrate de que la ruta sea correcta

const updatePasswords = async () => {
    const { data, error } = await supabase
        .from('usuario')
        .select('*');

    if (error) {
        console.log("Error al obtener usuarios:", error);
        return;
    }

    for (const user of data) {
        const hashedPassword = await bcrypt.hash(user.password, 10);  // Cifra la contraseña
        
        // Actualiza la contraseña cifrada en la base de datos
        const { error: updateError } = await supabase
            .from('usuario')
            .update({ password: hashedPassword })
            .eq('id', user.id);

        if (updateError) {
            console.log(`Error al actualizar la contraseña de usuario ${user.id}:`, updateError);
        } else {
            console.log(`Contraseña actualizada para usuario ${user.id}`);
        }
    }
};

updatePasswords();