import bcrypt from "bcrypt";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

export async function register(req, res) {
    const { username, email, password } = req.body; //Las variables tienen que tener el mismo nombre que en el modelo para sacar los datos correctos

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Faltan campos obligatorios"
        });
    }

    try {
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
        console.error("Error al registrar investigador:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "El correo electrónico ya está registrado"
            });
        }

        return res.status(500).json({
            message: "Error al registrar el investigador"
        });
    }
}

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email y contraseña obligatorios"
        });
    }

    try {
        // 1. Buscar el usuario.
        const user = await User.findOne({ email });

        // 2. Comprobar si existe.
        if (!user) {
            return res.status(401).json({
                message: "Credenciales incorrectas"
            });
        }

        // 3. Comparar la contraseña.
        const validPassword = await bcrypt.compare(password, user.passwordHash);

        // 4. Comprobar si coincide.
        if (!validPassword) {
            return res.status(401).json({
                message: "Credenciales incorrectas"
            });
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
        console.error("Error durante el login:", error);

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}