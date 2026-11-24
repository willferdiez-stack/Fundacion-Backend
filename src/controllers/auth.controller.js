import bcrypt from "bcrypt";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/HttpError.js";

export async function register(req, res, next) {
    try {
        const { username, email, password } = req.body; //Las variables tienen que tener el mismo nombre que en el modelo para sacar los datos correctos

        if (!username || !email || !password) {
            throw new HttpError(400, "Faltan campos obligatorios");
        }
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            passwordHash
        });

        return res.status(201).json({
            message: "Investigador registrado correctamente",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new HttpError(400, "Email y contraseña obligatorios");
        }

        // 1. Buscar el usuario.
        const user = await User.findOne({ email });

        // 2. Comprobar si existe.
        if (!user) {
            throw new HttpError(401, "Credenciales incorrectas");
        }

        // 3. Comparar la contraseña.
        const validPassword = await bcrypt.compare(password, user.passwordHash);

        // 4. Comprobar si coincide.
        if (!validPassword) {
            throw new HttpError(401, "Credenciales incorrectas");
        }

        // 5. Aquí añadiremos el JWT y la respuesta de éxito.
        const token = jwt.sign(
            { userId: user._id.toString(), role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "Inicio de sesión correcto",
            token,
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

export function getMe(req, res) {
    return res.status(200).json({
        message: "Investigador autenticado",
        user: req.user
    });
}