const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Verificar si las credenciales están configuradas
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERROR: Las credenciales de Supabase no están configuradas en .env');
    process.exit(1); // Detener la ejecución si faltan las credenciales
}

let supabase;

try {
    // Crear cliente de Supabase
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    console.error('❌ ERROR: No se pudo conectar a Supabase', error.message);
    process.exit(1); // Detener la ejecución si falla la conexión
}

module.exports = supabase;