require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');

// Importación de rutas
const routes = require('./configurations/routes'); // Rutas principales

const { verifyToken, verifyAdmin } = require('./security/verifier');
const clientesRoutes = require('./routes/clientes');  // Rutas de clientes
const gruposRoutes = require('./routes/grupos');  // Rutas de grupos
const visitasRoutes = require('./routes/visitas');  // Rutas de visitas
const reportesRoutes = require('./routes/reportes');  // Rutas de reportes
const configuracionRoutes = require('./routes/configuracion'); 
const userRoutes = require('./routes/user');


// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Usamos las rutas configuradas
app.use('/api', routes);  // Ruta base, donde se definen todos los endpoints

// Rutas protegidas por JWT
app.use('', userRoutes);
app.use('/clientes', verifyToken, clientesRoutes);  // Protegemos la ruta con JWT
app.use('/visitas', verifyToken, visitasRoutes);  // Protegemos la ruta con JWT
app.use('/reportes', verifyToken, reportesRoutes);  // Protegemos la ruta con JWT
app.use('/configuracion', configuracionRoutes);


// Ruta de grupos sin protección JWT, si se requiere protección se puede agregar
app.use('/grupos', gruposRoutes);  // Puede ser protegida si es necesario

// Iniciar el servidor
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});