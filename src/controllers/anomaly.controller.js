import Anomaly from "../models/anomaly.js";
import User from "../models/user.js";
import { canModifyAnomaly } from "../utils/permissions.js";
import { HttpError } from "../utils/HttpError.js";

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