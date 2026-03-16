import { ReadingHistory } from '../models/index.js';

export const updateReadingHistory = async (req, res) => {
  try {
    const { comicId, chapterId } = req.body;
    
    const history = await ReadingHistory.findOneAndUpdate(
      { user: req.user._id, comic: comicId },
      { chapter: chapterId },
      { upsert: true, new: true }
    );
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReadingHistory = async (req, res) => {
  try {
    const history = await ReadingHistory.find({ user: req.user._id })
      .populate('comic')
      .populate('chapter')
      .sort({ updatedAt: -1 });
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReadingHistory = async (req, res) => {
  try {
    await ReadingHistory.findOneAndDelete({
      user: req.user._id,
      comic: req.params.comicId,
    });
    
    res.json({ message: 'Reading history deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};