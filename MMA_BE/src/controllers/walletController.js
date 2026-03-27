import { Chapter, ChapterUnlock, User, WalletTransaction } from "../models/index.js";

const getChapterPriceCoins = () => {
  const raw = process.env.CHAPTER_PRICE_COINS;
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
};

export const getMyWallet = async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ coinBalance: req.user?.coinBalance ?? 0, coinRateVnd: 1000 });
};

export const unlockChapter = async (req, res) => {
  const chapterId = req.params.id;
  const priceCoins = getChapterPriceCoins();

  const chapter = await Chapter.findById(chapterId).select({ comic: 1, chapterNumber: 1, title: 1 });
  if (!chapter) {
    return res.status(404).json({ message: "Chapter not found" });
  }

  // Free unlock (first 1/3 chapters).
  if (typeof chapter.chapterNumber === "number") {
    const total = await Chapter.countDocuments({ comic: chapter.comic });
    const freeCount = Math.ceil(total / 3);
    if (freeCount > 0 && chapter.chapterNumber <= freeCount) {
      return res.json({ unlocked: true, coinBalance: req.user.coinBalance, priceCoins: 0, freeChapter: true });
    }
  }

  if (priceCoins === 0) {
    return res.json({ unlocked: true, coinBalance: req.user.coinBalance, priceCoins: 0 });
  }

  const existing = await ChapterUnlock.findOne({ user: req.user._id, chapter: chapter._id }).lean();
  if (existing) {
    return res.json({ unlocked: true, coinBalance: req.user.coinBalance, priceCoins });
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user._id, coinBalance: { $gte: priceCoins } },
    { $inc: { coinBalance: -priceCoins } },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(402).json({
      message: "Insufficient coins",
      requiredCoins: priceCoins,
      coinBalance: req.user.coinBalance ?? 0,
    });
  }

  try {
    await ChapterUnlock.create({
      user: req.user._id,
      comic: chapter.comic,
      chapter: chapter._id,
      priceCoins,
    });

    await WalletTransaction.create({
      user: req.user._id,
      type: "debit",
      coins: priceCoins,
      provider: "system",
      status: "succeeded",
      metadata: { reason: "chapter_unlock", chapterId: String(chapter._id) },
    });
  } catch (err) {
    // If unlock already exists due to race, refund coins.
    if (err?.code === 11000) {
      await User.updateOne({ _id: req.user._id }, { $inc: { coinBalance: priceCoins } });
      return res.json({ unlocked: true, coinBalance: updatedUser.coinBalance + priceCoins, priceCoins });
    }

    await User.updateOne({ _id: req.user._id }, { $inc: { coinBalance: priceCoins } });
    return res.status(500).json({ message: "Unlock failed" });
  }

  return res.json({ unlocked: true, coinBalance: updatedUser.coinBalance, priceCoins });
};
