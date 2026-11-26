import { HttpError } from "../utils/HttpError.js";

/**
 * Gestiona de forma centralizada los errores de la API.
 *
 * Reconoce errores HttpError, JSON mal formado y errores habituales
 * de Mongoose, como validaciones incorrectas, identificadores no válidos
 * y valores duplicados.
 *
 * Los errores inesperados generan una respuesta HTTP 500.
 *
 * @param {Error} err - Error que debe gestionarse.
 * @param {Object} req - Petición HTTP de Express.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Siguiente middleware de Express.
 */
export function errorHandler(err, req, res, next) {
    console.error("Error capturado:", err);

    // Errores HTTP creados por nosotros.
    if (err instanceof HttpError) {
        return res.status(err.status).json({
            message: err.message
        });
    }

    // JSON mal formado en el cuerpo de la petición.
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            message: "El JSON de la petición no es válido"
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