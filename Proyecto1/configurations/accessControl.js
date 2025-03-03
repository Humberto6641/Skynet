
const verifier = require('../security/verifier'); // Middleware para verificación de JWT

// Middleware para verificar si el usuario es Administrador
const checkAdmin = (req, res, next) => {
  if (req.user.rol !== 'Administrador') {//  Administrador, supabase es sensible a las mayusculas
    return res.status(403).send('Acceso no autorizado');
  }
  next();
};

// Middleware para verificar si el usuario es Supervisor o Administrador
const checkSupervisor = (req, res, next) => {
  if (req.user.rol !== 'Supervisor' && req.user.rol !== 'Administrador') {
    return res.status(403).send('Acceso no autorizado');
  }
  next();
};

// Middleware para verificar si el usuario es Técnico, Supervisor o Admin
const checkTecnico = (req, res, next) => {
  if (req.user.rol !== 'Técnico' && req.user.rol !== 'Supervisor' && req.user.rol !== 'Administrador') {
    return res.status(403).send('Acceso no autorizado');
  }
  next();
};

module.exports = { checkAdmin, checkSupervisor, checkTecnico };