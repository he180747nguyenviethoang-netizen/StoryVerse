import express from "express";
import { protect } from "../middlewares/auth.js";
import { getMyWallet } from "../controllers/walletController.js";

const router = express.Router();

router.get("/me", protect, getMyWallet);

export default router;

