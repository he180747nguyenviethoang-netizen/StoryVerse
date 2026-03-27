import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createVnpayCheckout,
  listCoinPacks,
  vnpayMockConfirm,
  vnpayMockPay,
  vnpayIpn,
  vnpayReturn,
} from "../controllers/vnpayController.js";

const router = express.Router();

router.get("/coin-packs", listCoinPacks);
router.post("/vnpay/checkout", protect, createVnpayCheckout);
router.get("/vnpay/pay", vnpayMockPay);
router.get("/vnpay/confirm", vnpayMockConfirm);
router.post("/vnpay/confirm", vnpayMockConfirm);
router.get("/vnpay/return", vnpayReturn);
router.get("/vnpay/ipn", vnpayIpn);

export default router;
