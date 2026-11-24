import { HttpError } from "../utils/HttpError.js";

export function errorHandler(err, req, res, next) {
    console.error("Error capturado:", err);

    // Errores HTTP creados por nosotros.
    if (err instanceof HttpError) {
        return res.status(err.status).json({
            message: err.message
        });
    }

    // Errores de validación de Mongoose.
    if (err.name === "ValidationError") {
        return res.status(400).json({
            message: "Datos no válidos"
        });
    }

    // Identificadores de MongoDB mal formados.
    if (err.name === "CastError") {
        return res.status(400).json({
            message: "Identificador no válido"
        });
    }

    // Valores duplicados en campos únicos.
    if (err.code === 11000) {
        return res.status(409).json({
            message: "Ya existe un registro con ese valor"
        });
    }

    // Cualquier otro error inesperado.
    return res.status(500).json({
        message: "Error interno del servidor"
    });
}