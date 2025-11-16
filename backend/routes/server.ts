import { Router } from "express";
import {
  getAllServers,
  getMyServerByServerId,
  getMyServers,
  getServerById,
} from "../controllers/server.js";
import { authenticate } from "../middleware.js";

const router = Router();

// GET routes
router.get("/servers", authenticate, getAllServers);
router.get("/server/my-server/:serverId", getMyServerByServerId);
router.get("/server/my-servers", getMyServers);
router.get("/server/:serverId", getServerById);

export default router;
