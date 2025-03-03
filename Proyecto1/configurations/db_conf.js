const { createClient } = require('@supabase/supabase-js');


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Verificar si las credenciales están configuradas antes de iniciar la conexion
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR: Las credenciales de Supabase no están configuradas en .env');
    process.exit(1); 
}

let supabase;

try {
    // Crear cliente de Supabase con las llaves de .env
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    console.error('ERROR: No se pudo conetar a Supabase', error.message);
    process.exit(1); 
}

module.exports = supabase;