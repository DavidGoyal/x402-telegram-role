import { Router } from "express";
import {
  buyMyServerSubscription,
  createInvoice,
  getAccess,
  getInvoice,
  isValidPersonJoiningServer,
} from "../controllers/access.js";
import { authenticate } from "../middleware.js";

const app = Router();

app.post("/access", getAccess);
app.post("/invoice", authenticate, createInvoice);
app.get("/invoice", getInvoice);
app.post("/isValidPerson", authenticate, isValidPersonJoiningServer);
app.post(
  "/server/my-server/:serverTelegramId/subscription",
  buyMyServerSubscription
);

export default app;
