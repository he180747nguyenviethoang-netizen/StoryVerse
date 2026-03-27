import crypto from "crypto";
import qs from "querystring";
import { User, WalletTransaction } from "../models/index.js";

const COIN_PACKS = [
  { id: "pack_10", coins: 10, amountVnd: 10_000 },
  { id: "pack_50", coins: 50, amountVnd: 50_000 },
  { id: "pack_100", coins: 100, amountVnd: 100_000 },
];

function getPaymentMode() {
  const raw = process.env.PAYMENT_MODE?.trim().toLowerCase();
  if (!raw) return "mock";
  if (raw === "vnpay" || raw === "mock") return raw;
  return "mock";
}

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
  const mode = getPaymentMode();
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  const { packId } = req.body || {};
  const pack = COIN_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return res.status(400).json({ message: "Invalid packId" });
  }

  const txnRef = `${crypto.randomBytes(8).toString("hex")}_${Date.now()}`;
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

  if (mode === "mock") {
    const payPage = `${baseUrl}/api/payments/vnpay/pay?ref=${encodeURIComponent(txnRef)}`;
    return res.json({ url: payPage, mode });
  }

  if (!tmnCode || !hashSecret) {
    return res.status(500).json({ message: "Missing VNPay configuration" });
  }

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
  const isMock = String(req.query?.mock || "").trim() === "1";
  if (isMock) {
    return res
      .type("html")
      .send(
        "<h2>Thanh toán thành công</h2><p>Bạn có thể đóng trang này và quay lại ứng dụng để kiểm tra số coin.</p>"
      );
  }

  // VNPay real return: show a minimal page to the user.
  return res
    .type("html")
    .send("<h2>Đang xử lý thanh toán...</h2><p>Bạn có thể quay lại ứng dụng và kiểm tra số coin.</p>");
};

export const vnpayMockPay = async (req, res) => {
  const ref = String(req.query?.ref || "").trim();
  if (!ref) {
    return res.status(400).type("html").send("<h3>Thiếu mã giao dịch (ref).</h3>");
  }

  // Use same-origin relative URLs to avoid https/http mismatch issues on local IPs (e.g. 192.168.x.x).
  const confirmUrl = `/api/payments/vnpay/confirm`;
  const payUrl = `/api/payments/vnpay/pay?ref=${encodeURIComponent(ref)}`;

  const tx = await WalletTransaction.findOne({ "metadata.vnpayTxnRef": ref }).lean();
  if (!tx) {
    return res.status(404).type("html").send("<h3>Không tìm thấy giao dịch.</h3>");
  }

  const status = String(tx.status || "pending");
  const title =
    status === "succeeded"
      ? "Thanh toán thành công"
      : status === "failed"
        ? "Đã hủy thanh toán"
        : "Thanh toán VNPay (Mô phỏng)";

  const badgeColor =
    status === "succeeded" ? "#16a34a" : status === "failed" ? "#dc2626" : "#f59e0b";

  const body =
    status === "pending"
      ? `
        <div style="margin-top:14px; padding:14px; border:1px solid #1f2937; border-radius:14px; background:#0b1220;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div>
              <div style="color:#9ca3af; font-size:12px; font-weight:800;">Mã QR (mô phỏng)</div>
              <div style="color:#e5e7eb; font-size:12px; margin-top:4px;">Quét để thanh toán gói coin</div>
            </div>
            <div style="color:#e5e7eb; font-weight:900;">${Number(tx.amountVnd) || 0} VND</div>
          </div>

          <div style="margin-top:12px; width:220px; height:220px; border-radius:16px; background:#ffffff; display:flex; align-items:center; justify-content:center;">
            <div style="width:188px; height:188px; border:12px solid #111827; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#111827; font-weight:900; text-align:center; padding:8px;">
              VNPAY<br/>QR<br/><span style="font-size:10px; font-weight:800;">${ref}</span>
            </div>
          </div>

          <div style="display:flex; gap:12px; margin-top:14px;">
            <a href="${confirmUrl}?ref=${encodeURIComponent(ref)}&result=success"
               style="flex:1; text-align:center; padding:14px 16px; border-radius:12px; border:none; background:#16a34a; color:#fff; font-weight:900; text-decoration:none;">
              Thanh toán
            </a>
            <a href="${confirmUrl}?ref=${encodeURIComponent(ref)}&result=failed"
               style="flex:1; text-align:center; padding:14px 16px; border-radius:12px; border:1px solid #dc2626; background:#fff; color:#dc2626; font-weight:900; text-decoration:none;">
              Hủy
            </a>
          </div>

          <p style="margin-top:12px; color:#9ca3af; font-size:12px;">Sau khi bấm, đợi trạng thái chuyển sang <b>SUCCESS</b> rồi đóng trang để quay lại ứng dụng.</p>
        </div>
      `
      : `
        <div style="margin-top:14px; padding:14px; border:1px solid #1f2937; border-radius:14px; background:#0b1220;">
          <p style="margin:0; color:#e5e7eb;">Bạn có thể đóng trang này và quay lại ứng dụng để kiểm tra số coin.</p>
          <p style="margin:10px 0 0 0;"><a href="${payUrl}" style="color:#93c5fd; font-weight:900; text-decoration:none;">Xem lại giao dịch</a></p>
        </div>
      `;

  res.type("html").send(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding:20px; background:#0b0b10; color:#e5e7eb;">
        <div style="max-width:540px; margin:0 auto; background:#111827; border:1px solid #1f2937; border-radius:16px; padding:18px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <h2 style="margin:0; font-size:18px;">${title}</h2>
            <span style="padding:6px 10px; border-radius:999px; background:${badgeColor}; color:#fff; font-weight:800; font-size:12px;">
              ${String(status).toUpperCase()}
            </span>
          </div>
          <div style="margin-top:14px; background:#0b1220; border:1px solid #1f2937; border-radius:12px; padding:12px;">
            <div style="display:flex; justify-content:space-between; gap:12px;">
              <span style="color:#9ca3af;">Giao dịch</span>
              <code style="color:#fff;">${ref}</code>
            </div>
            <div style="display:flex; justify-content:space-between; gap:12px; margin-top:8px;">
              <span style="color:#9ca3af;">Pack</span>
              <span style="color:#fff;">${tx?.metadata?.packId || "-"}</span>
            </div>
            <div style="display:flex; justify-content:space-between; gap:12px; margin-top:8px;">
              <span style="color:#9ca3af;">Coins</span>
              <strong style="color:#fff;">+${Number(tx.coins) || 0}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:12px; margin-top:8px;">
              <span style="color:#9ca3af;">Số tiền</span>
              <strong style="color:#fff;">${Number(tx.amountVnd) || 0} VND</strong>
            </div>
          </div>
          ${body}
        </div>
      </body>
    </html>
  `);
};

export const vnpayMockConfirm = async (req, res) => {
  const ref = String((req.body?.ref ?? req.query?.ref) || "").trim();
  const result = String((req.body?.result ?? req.query?.result) || "").trim().toLowerCase();

  if (!ref) {
    return res.status(400).type("html").send("<h3>Thiếu mã giao dịch (ref).</h3>");
  }

  const tx = await WalletTransaction.findOne({ "metadata.vnpayTxnRef": ref });
  if (!tx) {
    return res.status(404).type("html").send("<h3>Không tìm thấy giao dịch.</h3>");
  }

  if (tx.status === "succeeded" || tx.status === "failed") {
    return res.redirect(`/api/payments/vnpay/pay?ref=${encodeURIComponent(ref)}`);
  }

  const isSuccess = result === "success" || result === "succeeded" || result === "ok";

  if (!isSuccess) {
    tx.status = "failed";
    tx.metadata = {
      ...(tx.metadata || {}),
      mockResult: "failed",
      mockAt: new Date().toISOString(),
      mockIp: getClientIp(req),
    };
    await tx.save();
    return res.redirect(`/api/payments/vnpay/pay?ref=${encodeURIComponent(ref)}`);
  }

  await User.updateOne({ _id: tx.user }, { $inc: { coinBalance: tx.coins } });
  tx.status = "succeeded";
  tx.metadata = {
    ...(tx.metadata || {}),
    mockResult: "succeeded",
    mockAt: new Date().toISOString(),
    mockIp: getClientIp(req),
  };
  await tx.save();

  return res.redirect(`/api/payments/vnpay/pay?ref=${encodeURIComponent(ref)}`);
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
