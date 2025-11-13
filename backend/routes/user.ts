import { Router } from "express";
import { getUserInfo } from "../controllers/user.js";

const app = Router();

app.get("/user/:telegramId", getUserInfo);

export default app;
