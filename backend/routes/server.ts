import { Router } from "express";
import { getAllServers, getServerById } from "../controllers/server.js";

const router = Router();

// GET routes
router.get("/servers", getAllServers);
router.get("/server/:serverId", getServerById);

export default router;
