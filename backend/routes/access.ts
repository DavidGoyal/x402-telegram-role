import { Router } from "express";
import {
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

export default app;
