import User from "../models/user.js";
import { HttpError } from "../utils/HttpError.js";

export async function getUsers(req, res, next) {
    try {
        const users = await User.find().select("username email role createdAt");

        // Responder con 200.
        return res.status(200).json({
            users
        });
    } catch (error) {
        next(error);
    }
}

export async function updateUserRole(req, res, next) {
    try {
        const { role } = req.body;

        if (!["admin", "user", "classC"].includes(role)) {
            throw new HttpError(400, "Rol no válido");
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            throw new HttpError(404, "Usuario no encontrado");
        }

        if (req.user.id === req.params.id) {
            throw new HttpError(403, "No puedes modificar tu propio rol");
        }

        user.role = role;
        await user.save();

        return res.status(200).json({
            message: "Rol actualizado correctamente",
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
}