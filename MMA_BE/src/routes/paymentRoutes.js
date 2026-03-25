import express from "express";
import { protect } from "../middlewares/auth.js";
import { createCheckoutSession, listCoinPacks } from "../controllers/paymentController.js";

const router = express.Router();

router.get("/coin-packs", listCoinPacks);
router.post("/checkout", protect, createCheckoutSession);

export default router;

