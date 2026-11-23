import mongoose from "mongoose";

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