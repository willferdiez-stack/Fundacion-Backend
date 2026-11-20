import bcrypt from "bcrypt";
import User from "../models/user.js";

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