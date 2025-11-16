import { Router } from "express";
import { createInvoice, getAccess, getInvoice } from "../controllers/access.js";
import { authenticate } from "../middleware.js";

const app = Router();

app.post("/access", getAccess);
app.post("/invoice", authenticate, createInvoice);
app.get("/invoice", getInvoice);

export default app;
