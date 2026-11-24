import express from "express"; // para crear el servidor y gestionar las peticiones HTTP
import dotenv from "dotenv"; // para cargar variables de entorno desde el archivo .env
import { connectDB } from "./config/db.js"; // para conectar con la base de datos
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import anomalyRouter from "./routes/anomaly.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config(); //carga las variables del archivo .env

const PORT = process.env.PORT || 3001;

const app = express(); // creamos nuestra aplicación Express

// Middlewares - (funciones que procesan una petición antes de que llegue a su controlador)
app.use(express.json()); // permite leer el body de los POST en json

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/anomalies", anomalyRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);

/**
 * Inicia la aplicación después de conectar con MongoDB.
 *
 * Establece primero la conexión con la base de datos y,
 * si tiene éxito, comienza a escuchar peticiones HTTP
 * en el puerto configurado.
 *
 * @returns {Promise<void>}
 */
async function startServer() {
    try {
        await connectDB(); // conectamos con la base de datos
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
    }
}

startServer(); // iniciamos el servidor