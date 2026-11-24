import { Router } from "express";

/**
 * Define la ruta pública de comprobación del servidor.
 *
 * Permite verificar que la API responde correctamente
 * mediante una petición GET /api/health.
 */
const router = Router();

router.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "API de la Fundación operativa"
    });
});

export default router;