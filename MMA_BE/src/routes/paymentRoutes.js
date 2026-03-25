import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createVnpayCheckout,
  listCoinPacks,
  vnpayIpn,
  vnpayReturn,
} from "../controllers/vnpayController.js";

const router = express.Router();

router.get("/coin-packs", listCoinPacks);
router.post("/vnpay/checkout", protect, createVnpayCheckout);
router.get("/vnpay/return", vnpayReturn);
router.get("/vnpay/ipn", vnpayIpn);

export default router;

