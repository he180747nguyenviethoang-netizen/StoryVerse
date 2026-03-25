import crypto from "crypto";
import qs from "querystring";
import { User, WalletTransaction } from "../models/index.js";

const COIN_PACKS = [
  { id: "pack_10", coins: 10, amountVnd: 10_000 },
  { id: "pack_50", coins: 50, amountVnd: 50_000 },
  { id: "pack_100", coins: 100, amountVnd: 100_000 },
];

function getPublicBaseUrl(req) {
  const envUrl = process.env.PUBLIC_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.get("host");
  return `${proto}://${host}`;
}

function formatVnpDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

function buildSecureHash(params, secret) {
  const sorted = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  return crypto.createHmac("sha512", secret).update(signData, "utf8").digest("hex");
}

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) {
    return xf.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}

export const listCoinPacks = async (req, res) => {
  res.json({
    packs: COIN_PACKS.map((p) => ({
      id: p.id,
      coins: p.coins,
      amountVnd: p.amountVnd,
    })),
    coinRateVnd: 1000,
    chapterPriceCoins: Number(process.env.CHAPTER_PRICE_COINS) || 5,
  });
};

export const createVnpayCheckout = async (req, res) => {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  if (!tmnCode || !hashSecret) {
    return res.status(500).json({ message: "Missing VNPay configuration" });
  }

  const { packId } = req.body || {};
  const pack = COIN_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return res.status(400).json({ message: "Invalid packId" });
  }

  const txnRef = `${Date.now()}_${String(req.user._id)}`;
  const amount = pack.amountVnd * 100; // VNPay expects *100

  const baseUrl = getPublicBaseUrl(req);
  const returnUrl = (process.env.VNPAY_RETURN_URL || `${baseUrl}/api/payments/vnpay/return`).trim();

  await WalletTransaction.create({
    user: req.user._id,
    type: "credit",
    coins: pack.coins,
    amountVnd: pack.amountVnd,
    provider: "vnpay",
    status: "pending",
    metadata: { packId: pack.id, vnpayTxnRef: txnRef },
  });

  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Nap ${pack.coins} coin`,
    vnp_OrderType: "other",
    vnp_Amount: amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: getClientIp(req),
    vnp_CreateDate: formatVnpDate(),
  };

  const secureHash = buildSecureHash(vnpParams, hashSecret);
  const query = qs.stringify({ ...sortObject(vnpParams), vnp_SecureHash: secureHash }, { encode: true });

  res.json({ url: `${vnpUrl}?${query}` });
};

export const vnpayReturn = async (req, res) => {
  // Show a minimal page to the user.
  res
    .type("html")
    .send("<h2>Đang xử lý thanh toán...</h2><p>Bạn có thể quay lại ứng dụng và kiểm tra số coin.</p>");
};

export const vnpayIpn = async (req, res) => {
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  if (!hashSecret) {
    return res.status(500).json({ RspCode: "99", Message: "Missing config" });
  }

  const input = { ...req.query };
  const secureHash = input.vnp_SecureHash;
  delete input.vnp_SecureHash;
  delete input.vnp_SecureHashType;

  const computed = buildSecureHash(input, hashSecret);
  if (!secureHash || computed.toLowerCase() !== String(secureHash).toLowerCase()) {
    return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
  }

  const txnRef = input.vnp_TxnRef;
  const responseCode = input.vnp_ResponseCode;
  const transactionStatus = input.vnp_TransactionStatus;
  const payAmount = Number(input.vnp_Amount);

  const tx = await WalletTransaction.findOne({ "metadata.vnpayTxnRef": txnRef });
  if (!tx) {
    return res.status(200).json({ RspCode: "01", Message: "Order not found" });
  }

  // Validate amount
  const expected = (tx.amountVnd || 0) * 100;
  if (!Number.isFinite(payAmount) || expected !== payAmount) {
    return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
  }

  if (tx.status === "succeeded") {
    return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
  }

  const isSuccess = responseCode === "00" && transactionStatus === "00";

  if (!isSuccess) {
    tx.status = "failed";
    tx.metadata = {
      ...(tx.metadata || {}),
      vnpayResponseCode: responseCode,
      vnpayTransactionStatus: transactionStatus,
      vnpayTransactionNo: input.vnp_TransactionNo,
      vnpayBankCode: input.vnp_BankCode,
      vnpayPayDate: input.vnp_PayDate,
    };
    await tx.save();
    return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
  }

  // Credit coins atomically
  await User.updateOne({ _id: tx.user }, { $inc: { coinBalance: tx.coins } });

  tx.status = "succeeded";
  tx.metadata = {
    ...(tx.metadata || {}),
    vnpayResponseCode: responseCode,
    vnpayTransactionStatus: transactionStatus,
    vnpayTransactionNo: input.vnp_TransactionNo,
    vnpayBankCode: input.vnp_BankCode,
    vnpayPayDate: input.vnp_PayDate,
  };
  await tx.save();

  return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
};

