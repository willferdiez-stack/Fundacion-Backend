/**
 * Crea un middleware que restringe el acceso según el rol.
 *
 * Comprueba que el usuario autenticado tenga uno de los
 * roles permitidos. Si no está autorizado, responde con 403.
 *
 * @param {...string} allowedRoles - Roles que pueden acceder.
 * @returns {Function} Middleware de autorización de Express.
 */
export function authorize(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "No tienes permiso para acceder a este recurso"
            });
        }

        next();
    };
}