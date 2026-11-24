import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { createAnomaly, getAnomalies, getAnomalyByID, updateAnomaly, updateAnomalyAccess, deleteAnomaly } from "../controllers/anomaly.controller.js";

const router = Router();

router.post("/", authenticate, createAnomaly);
router.get("/", authenticate, getAnomalies);
router.get("/:id", authenticate, getAnomalyByID);
router.patch("/:id", authenticate, updateAnomaly);
router.delete("/:id", authenticate, deleteAnomaly);
router.patch("/:id/access", authenticate, updateAnomalyAccess);

export default router;