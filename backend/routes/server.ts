import { Router } from "express";
import {
  getAllServers,
  getMyServerByServerId,
  getMyServerRevenueStats,
  getMyServers,
  getServerById,
} from "../controllers/server.js";
import { authenticate } from "../middleware.js";

const router = Router();

// GET routes
router.get("/servers", authenticate, getAllServers);
router.get("/server/my-server/:serverTelegramId", getMyServerByServerId);
router.get(
  "/server/my-server/:serverTelegramId/revenue",
  getMyServerRevenueStats
);
router.get("/server/my-servers", getMyServers);
router.get("/server/:serverTelegramId", getServerById);

export default router;
