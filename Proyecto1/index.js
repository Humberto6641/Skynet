require('dotenv').config(); 
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
const configuracionRoutes = require('./routes/configuracion'); // Rutas de reportes
const userRoutes = require('./routes/user');


/// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.use('/api', routes);  // Ruta base, definen todos los endpoints

// Rutas protegidas por JWT
app.use('', userRoutes);
app.use('/clientes', verifyToken, clientesRoutes);  
app.use('/visitas', verifyToken, visitasRoutes);  
app.use('/reportes', verifyToken, reportesRoutes);  
app.use('/configuracion', configuracionRoutes);

app.use('/grupos', gruposRoutes); 

// Iniciar el servidor
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});