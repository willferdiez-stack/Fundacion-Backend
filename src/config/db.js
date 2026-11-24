import mongoose from "mongoose";

/**
 * Establece la conexión con MongoDB mediante Mongoose.
 *
 * Utiliza la dirección configurada en la variable de entorno
 * MONGO_URI. Si la conexión falla, el error se propaga
 * al proceso de arranque del servidor.
 *
 * @returns {Promise<void>} Promesa que se resuelve al conectar.
 */
export async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión con MongoDB establecida");
}