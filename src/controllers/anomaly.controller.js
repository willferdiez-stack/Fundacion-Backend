import Anomaly from "../models/anomaly.js";
import User from "../models/user.js";
import { canModifyAnomaly } from "../utils/permissions.js";
import { HttpError } from "../utils/HttpError.js";

/**
 * Registra una nueva anomalía en la base de datos.
 *
 * Solo los administradores e investigadores pueden crear expedientes.
 * La anomalía se asocia automáticamente al usuario autenticado
 * mediante el campo owner.
 *
 * @param {Object} req - Petición HTTP con los datos de la anomalía.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
export async function createAnomaly(req, res, next) {
    try {
        if (!["user", "admin"].includes(req.user.role)) {
            throw new HttpError(403, "No tienes permiso para registrar anomalías");
        }

        const {
            code,
            name,
            description,
            containmentClass,
            dangerLevel,
            protocols
        } = req.body;

        const anomaly = await Anomaly.create({
            code,
            name,
            description,
            containmentClass,
            dangerLevel,
            protocols,
            owner: req.user.id
        });

        return res.status(201).json({
            message: "Anomalía registrada correctamente",
            anomaly
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Obtiene la lista de anomalías accesibles para el usuario.
 *
 * Los administradores e investigadores pueden consultar todos
 * los expedientes. Los usuarios Clase C solo reciben aquellas
 * anomalías en cuyo array authorizedReaders aparecen incluidos.
 *
 * @param {Object} req - Petición HTTP con el usuario autenticado.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
export async function getAnomalies(req, res, next) {
    try {
        let filter = {};

        if (req.user.role === "classC") {
            filter = { authorizedReaders: req.user.id };
        }

        const anomalies = await Anomaly.find(filter);

        return res.status(200).json({
            anomalies
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Busca una anomalía por su identificador y comprueba su visibilidad.
 *
 * Los administradores e investigadores pueden consultar cualquier
 * expediente. Los usuarios Clase C solo pueden consultar aquellos
 * para los que tienen autorización individual.
 *
 * Si la anomalía no existe o no es accesible para Clase C,
 * se genera un error HTTP 404.
 *
 * @param {Object} req - Petición HTTP con el ID en req.params.id.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
export async function getAnomalyByID(req, res, next) {

    try {
        const filter = { _id: req.params.id };

        if (req.user.role === "classC") {
            filter.authorizedReaders = req.user.id;
        }

        const anomaly = await Anomaly.findOne(filter);

        if (!anomaly) {
            throw new HttpError(404, "Anomalía no encontrada");
        }

        return res.status(200).json({
            anomaly
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Actualiza los datos permitidos de una anomalía existente.
 *
 * Solo los administradores y los investigadores propietarios
 * pueden modificar un expediente. Los permisos se comprueban
 * mediante la función auxiliar canModifyAnomaly.
 *
 * Solo se permite actualizar el nombre, la descripción,
 * la clase de contención, el nivel de peligrosidad y los
 * protocolos. No se permite modificar el código ni el propietario.
 *
 * @param {Object} req - Petición HTTP con el ID y los campos a actualizar.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
export async function updateAnomaly(req, res, next) {
    try {
        const anomaly = await Anomaly.findById(req.params.id);

        if (!anomaly) {
            throw new HttpError(404, "Anomalía no encontrada");
        }

        if (!canModifyAnomaly(req.user, anomaly)) {
            throw new HttpError(403, "No tienes permiso para modificar esta anomalía");
        }

        const allowedFields = [
            "name",
            "description",
            "containmentClass",
            "dangerLevel",
            "protocols"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                anomaly[field] = req.body[field];
            }
        }

        await anomaly.save();

        return res.status(200).json({
            message: "Anomalía actualizada correctamente",
            anomaly
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Gestiona los permisos individuales de lectura de una anomalía.
 *
 * Permite conceder (grant) o retirar (revoke) el acceso de un
 * usuario al expediente mediante el array authorizedReaders.
 *
 * Solo los administradores y los investigadores propietarios
 * pueden gestionar estos permisos.
 *
 * La acción grant únicamente admite usuarios con rol classC.
 * Se utiliza addToSet para evitar referencias duplicadas
 * y pull para retirar una autorización existente.
 *
 * @param {Object} req - Petición HTTP con el ID de la anomalía.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
export async function updateAnomalyAccess(req, res, next) {
    try {
        const { userId, action } = req.body;

        // Comprobar que la operación solicitada es válida.
        if (!userId || !["grant", "revoke"].includes(action)) {
            throw new HttpError(400, "Debes indicar un usuario y una acción válida");
        }

        // Clase C no puede gestionar permisos.
        if (!["admin", "user"].includes(req.user.role)) {
            throw new HttpError(403, "No tienes permiso para gestionar accesos");
        }

        // Buscar la anomalía.
        const anomaly = await Anomaly.findById(req.params.id);

        if (!anomaly) {
            throw new HttpError(404, "Anomalía no encontrada");
        }

        // Solo el administrador o el investigador responsable pueden continuar.
        if (!canModifyAnomaly(req.user, anomaly)) {
            throw new HttpError(403, "No tienes permiso para gestionar esta anomalía");
        }

        // Buscar al usuario que recibirá o perderá el acceso.
        const user = await User.findById(userId);

        if (!user) {
            throw new HttpError(404, "Usuario no encontrado");
        }

        if (action === "grant") {
            if (user.role !== "classC") {
                throw new HttpError(400, "Solo puedes conceder acceso a usuarios Clase C");
            }

            anomaly.authorizedReaders.addToSet(user._id);

        } else {
            anomaly.authorizedReaders.pull(user._id);
        }

        await anomaly.save();

        return res.status(200).json({
            message: action === "grant"
                ? "Acceso concedido correctamente"
                : "Acceso retirado correctamente",
            authorizedReaders: anomaly.authorizedReaders
        });

    } catch (error) {
        next(error);
    }
}

/**
 * Elimina una anomalía de la base de datos.
 *
 * Comprueba que el expediente exista y que el usuario
 * sea administrador o investigador propietario mediante
 * la función canModifyAnomaly.
 *
 * Si el usuario no tiene permiso, devuelve un error 403
 * y no ejecuta la eliminación.
 *
 * @param {Object} req - Petición HTTP con el ID de la anomalía.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
export async function deleteAnomaly(req, res, next) {
    try {
        const anomaly = await Anomaly.findById(req.params.id);

        if (!anomaly) {
            throw new HttpError(404, "Anomalía no encontrada");
        }

        if (!canModifyAnomaly(req.user, anomaly)) {
            throw new HttpError(403, "No tienes permiso para eliminar esta anomalía");
        }

        await anomaly.deleteOne();

        return res.status(200).json({
            message: "Anomalía borrada correctamente",
        });
    } catch (error) {
        next(error);
    }
}