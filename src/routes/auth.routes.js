import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

/**
 * Agrupa las rutas de autenticación de usuarios.
 *
 * El registro y el inicio de sesión son públicos.
 * La consulta del usuario actual requiere un JWT válido.
 */
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);

export default router;