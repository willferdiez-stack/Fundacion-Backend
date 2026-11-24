import mongoose from "mongoose";

/**
 * Define el esquema de los usuarios de la Fundación.
 *
 * Almacena los datos de identificación, el hash de la contraseña
 * y el rol del usuario.
 *
 * El correo electrónico debe ser único y el rol predeterminado
 * para los nuevos registros es "user".
 *
 * Los campos createdAt y updatedAt se generan automáticamente.
 */
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ["user", "admin", "classC"],
        default: "user"
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;