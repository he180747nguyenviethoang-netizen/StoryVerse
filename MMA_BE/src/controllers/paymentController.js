import Stripe from "stripe";
import { User, WalletTransaction } from "../models/index.js";

const COIN_PACKS = [
  { id: "pack_10", coins: 10, amountVnd: 10_000 },
  { id: "pack_50", coins: 50, amountVnd: 50_000 },
  { id: "pack_100", coins: 100, amountVnd: 100_000 },
];

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
};

const getPublicBaseUrl = (req) => {
  const envUrl = process.env.PUBLIC_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.get("host");
  return `${proto}://${host}`;
};

export const listCoinPacks = async (req, res) => {
  res.json({
    packs: COIN_PACKS.map((p) => ({
      id: p.id,
      coins: p.coins,
      amountVnd: p.amountVnd,
    })),
    coinRateVnd: 1000,
  });
};

export const createCheckoutSession = async (req, res) => {
  const { packId } = req.body || {};
  const pack = COIN_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return res.status(400).json({ message: "Invalid packId" });
  }

  const stripe = getStripe();
  const baseUrl = getPublicBaseUrl(req);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "vnd",
          unit_amount: pack.amountVnd,
          product_data: {
            name: `${pack.coins} coins`,
            description: "Coin pack for unlocking chapters",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: String(req.user?._id || ""),
      coins: String(pack.coins),
      packId: pack.id,
    },
    success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payment/cancel`,
  });

  res.json({ url: session.url });
};

export const stripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ message: "Missing STRIPE_WEBHOOK_SECRET" });
  }

  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const stripeSessionId = session.id;

      const existing = await WalletTransaction.findOne({ stripeSessionId }).lean();
      if (existing) {
        return res.json({ received: true, duplicate: true });
      }

      const userId = session?.metadata?.userId;
      const coins = Number(session?.metadata?.coins);
      const amountVnd = session?.amount_total ?? undefined;

      if (!userId || !Number.isFinite(coins) || coins <= 0) {
        return res.status(400).json({ message: "Invalid webhook metadata" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await User.updateOne({ _id: user._id }, { $inc: { coinBalance: coins } });

      await WalletTransaction.create({
        user: user._id,
        type: "credit",
        coins,
        amountVnd,
        provider: "stripe",
        status: "succeeded",
        stripeEventId: event.id,
        stripeSessionId,
        metadata: {
          packId: session?.metadata?.packId,
          paymentStatus: session?.payment_status,
        },
      });
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Webhook handler failed" });
  }
};
