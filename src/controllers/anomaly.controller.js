import Anomaly from "../models/anomaly.js";

export async function createAnomaly(req, res) {
    if (!["user", "admin"].includes(req.user.role)) {
        return res.status(403).json({
            message: "No tienes permiso para registrar anomalías"
        });
    }

    // Aquí continuará la creación del expediente.
    try {
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
        console.error("Error al crear la anomalía:", error);

        //Diferentes tipos de código de error en el mismo IF
        if (error.code === 11000) { //Coódigo de error de MongoDB para duplicados
            return res.status(409).json({ //Código de error de HTTP para conflictos
                message: "Ya existe una anomalía con ese código"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Los datos de la anomalía no son válidos"
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}

export async function getAnomalies(req, res) {
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
        console.error("Error al obtener las anomalías:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}

export async function getAnomalyByID(req, res) {

    try {
        const filter = { _id: req.params.id };

        if (req.user.role === "classC") {
            filter.authorizedReaders = req.user.id;
        }

        const anomaly = await Anomaly.findOne(filter);

        return res.status(200).json({
            anomaly
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Identificador de anomalía no válido"
            });
        }
        console.error("Error al obtener la anomalía:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}

export async function updateAnomaly(req, res) {
    try {
        const anomaly = await Anomaly.findById(req.params.id);

        if (!anomaly) {
            return res.status(404).json({
                message: "Anomalía no encontrada"
            });
        }

        if (!["admin", "user"].includes(req.user.role)) {
            return res.status(403).json({
                message: "No tienes permiso para modificar anomalías"
            });
        }

        if (req.user.role !== "admin" && anomaly.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: "No tienes permiso para modificar esta anomalía"
            });
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
        console.error("Error al actualizar la anomalía:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}

export async function deleteAnomaly(req, res) {
    try {
        const anomaly = await Anomaly.findById(req.params.id);

        if (!anomaly) {
            return res.status(404).json({
                message: "Anomalía no encontrada"
            });
        }

        if (!["admin", "user"].includes(req.user.role)) {
            return res.status(403).json({
                message: "No tienes permiso para borrar anomalías"
            });
        }

        if (req.user.role !== "admin" && anomaly.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: "No tienes permiso para borrar esta anomalía"
            });
        }

        await anomaly.deleteOne();

        return res.status(200).json({
            message: "Anomalía borrada correctamente",
        });
    } catch (error) {
        console.error("Error al eliminar la anomalía:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}