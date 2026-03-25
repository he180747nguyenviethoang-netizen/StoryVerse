import { Chapter, ChapterUnlock, Comic } from '../models/index.js';

const getChapterPriceCoins = () => {
  const raw = process.env.CHAPTER_PRICE_COINS;
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
};

export const createChapter = async (req, res) => {
  try {
    const chapter = await Chapter.create(req.body);
    res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChaptersByComic = async (req, res) => {
  try {
    const chapters = await Chapter.find({ comic: req.params.comicId })
      .select({ pages: 0 })
      .sort({ chapterNumber: 1 })
      .lean();

    const priceCoins = getChapterPriceCoins();
    let unlockedSet = new Set();

    if (req.user?._id) {
      const unlocks = await ChapterUnlock.find({
        user: req.user._id,
        chapter: { $in: chapters.map((c) => c._id) },
      })
        .select({ chapter: 1 })
        .lean();
      unlockedSet = new Set(unlocks.map((u) => String(u.chapter)));
    }

    const result = chapters.map((ch) => ({
      ...ch,
      locked: priceCoins > 0 ? !unlockedSet.has(String(ch._id)) : false,
      priceCoins,
    }));

    res.json({
      chapters: result,
      totalChapters: result.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('comic').lean();

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    const priceCoins = getChapterPriceCoins();
    let unlocked = priceCoins === 0;

    if (!unlocked && req.user?._id) {
      const hasUnlock = await ChapterUnlock.exists({
        user: req.user._id,
        chapter: chapter._id,
      });
      unlocked = Boolean(hasUnlock);
    }

    if (!unlocked) {
      return res.json({
        ...chapter,
        pages: [],
        locked: true,
        priceCoins,
      });
    }

    // Only count views for unlocked reads.
    await Chapter.updateOne({ _id: chapter._id }, { $inc: { views: 1 } });

    if (chapter.comic?._id) {
      const [sumResult] = await Chapter.aggregate([
        { $match: { comic: chapter.comic._id } },
        { $group: { _id: '$comic', totalViews: { $sum: '$views' } } },
      ]);
      const totalViews = sumResult?.totalViews ?? 0;
      await Comic.findByIdAndUpdate(chapter.comic._id, { views: totalViews });
    }

    res.json({ ...chapter, locked: false, priceCoins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
