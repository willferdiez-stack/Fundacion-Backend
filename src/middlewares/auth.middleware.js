import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * Autentica una petición mediante un token JWT.
 *
 * Comprueba que exista un token Bearer válido y busca
 * al usuario en MongoDB para obtener su rol actual.
 * Si la autenticación es correcta, añade id y role
 * a req.user y permite continuar la petición.
 *
 * @param {Object} req - Petición HTTP de Express.
 * @param {Object} res - Respuesta HTTP de Express.
 * @param {Function} next - Función para continuar la petición.
 */
export async function authenticate(req, res, next) {
    const authorization = req.headers.authorization;

    // 1. Comprobar que la petición incluye un token
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token no proporcionado"
        });
    }

    const token = authorization.split(" ")[1];

    // 2. Verificar que el token es válido
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o caducado"
        });
    }

    // 3. Buscar al usuario en MongoDB y obtener su rol actual
    try {
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "Usuario no encontrado o sin acceso"
            });
        }

        req.user = {
            id: user._id.toString(),
            role: user.role
        };

    } catch (error) {
        console.error("Error al consultar el usuario:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }

    // 4. Permitir que la petición continúe
    next();
}