import { Chapter, Comic } from '../models/index.js';

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
      .sort({ chapterNumber: 1 });
    res.json({
      chapters,
      totalChapters: chapters.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('comic');

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    chapter.views += 1;
    await chapter.save();

    if (chapter.comic?._id) {
      const [sumResult] = await Chapter.aggregate([
        { $match: { comic: chapter.comic._id } },
        { $group: { _id: '$comic', totalViews: { $sum: '$views' } } },
      ]);
      const totalViews = sumResult?.totalViews ?? 0;
      await Comic.findByIdAndUpdate(chapter.comic._id, { views: totalViews });
    }

    res.json(chapter);
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
