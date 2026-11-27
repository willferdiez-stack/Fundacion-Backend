import mongoose from "mongoose";

/**
 * Define el esquema de los expedientes de anomalías.
 *
 * Cada expediente tiene un código único, una clase de contención
 * y un nivel de peligrosidad comprendido entre 1 y 5.
 *
 * El campo owner referencia al usuario propietario y el array
 * authorizedReaders contiene referencias a usuarios con permiso
 * de lectura.
 *
 * Los protocolos se almacenan como subdocumentos embebidos.
 */
const anomalySchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    containmentClass: {
        type: String,
        required: true,
        enum: ["Safe", "Euclid", "Keter"]
    },
    dangerLevel: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorizedReaders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    protocols: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        }
    }]
}, { timestamps: true });

const Anomaly = mongoose.model("Anomaly", anomalySchema);

export default Anomaly;