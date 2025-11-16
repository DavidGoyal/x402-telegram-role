import { Router } from "express";
import { getUserById, getUserByTelegramId } from "../controllers/user.js";
import { authenticate } from "../middleware.js";

const app = Router();

app.get("/user/:telegramId", authenticate, getUserByTelegramId);
app.get("/user/id/:userId", getUserById);

export default app;
