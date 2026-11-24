import User from "../models/user.js";

export async function getUsers(req, res) {
    try {
        const users = await User.find().select("username email role createdAt");

        // Responder con 200.
        return res.status(200).json({
            users
        });
    } catch (error) {
        // Gestionar el error.
        console.error("Error al obtener los usuarios:", error);
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}

export async function updateUserRole(req, res) {
    try {
        const { role } = req.body;

        if (!["admin", "user", "classC"].includes(role)) {
            return res.status(400).json({
                message: "Rol no válido"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        if (req.user.id === req.params.id) {
            return res.status(403).json({
                message: "No puedes modificar tu propio rol"
            });
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
        console.error("Error al modificar el usuario:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Identificador de usuario no válido"
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}