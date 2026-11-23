import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token no proporcionado"
        });
    }

    const token = authorization.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.userId,
            role: decoded.role
        };

    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o caducado"
        });
    }

    next();
}