const bcrypt = require('bcrypt');

const passwordIngresada = 'Técnico';  
const passwordEncriptada = '$2b$10$xU3ixvRG9dWBhRZ4Gyt/TexU5XFJgqK2w9H.6jlX7q3uEret7sqB';  // Reemplaza con el valor de la BD

bcrypt.compare(passwordIngresada, passwordEncriptada)
    .then(resultado => {
        console.log('¿Las contraseñas coinciden?', resultado);
    })
    .catch(error => {
        console.error('Error en comparación:', error);
    });