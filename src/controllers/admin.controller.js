import User from "../models/user.js";
import { HttpError } from "../utils/HttpError.js";

/**
 * Obtiene la lista de usuarios registrados.
 *
 * Consulta MongoDB y devuelve únicamente los campos
 * necesarios para la administración, sin incluir
 * los hashes de las contraseñas.
 *
 * El acceso a esta operación está protegido por
 * el middleware de autorización de administradores.
 *
 * @param {Object} req - Petición HTTP de Express.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
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

/**
 * Modifica el rol de un usuario registrado.
 *
 * Comprueba que el rol solicitado sea válido,
 * que el usuario exista y que el administrador
 * no esté intentando modificar su propio rol.
 *
 * Solo permite los roles "admin", "user" y "classC".
 *
 * @param {Object} req - Petición con el ID del usuario y el nuevo rol.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Envía los errores al middleware centralizado.
 */
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