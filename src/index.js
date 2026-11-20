import express from "express"; // para crear el servidor y gestionar las peticiones HTTP
import dotenv from "dotenv"; // para cargar variables de entorno desde el archivo .env

dotenv.config(); //carga las variables del archivo .env

const PORT = process.env.PORT || 3001;

const app = express(); // creamos nuestra aplicación Express

// Middlewares - (funciones que procesan una petición antes de que llegue a su controlador)
app.use(express.json()); // permite leer el body de los POST en json

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "API de la Fundación operativa"
    });
});