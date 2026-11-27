import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { getUsers, updateUserRole } from "../controllers/admin.controller.js";

/**
 * Define las rutas administrativas de la Fundación.
 *
 * Permite consultar usuarios y modificar sus roles.
 * Todas las operaciones requieren autenticación
 * y autorización con el rol "admin".
 */
const router = Router();

router.get("/users", authenticate, authorize("admin"), getUsers);
router.patch("/users/:id/role", authenticate, authorize("admin"), updateUserRole);

export default router;