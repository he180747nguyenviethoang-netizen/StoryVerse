import { Comment } from '../models/index.js';

export const createComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      ...req.body,
      user: req.user._id,
    });
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar');
    
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByComic = async (req, res) => {
  try {
    const comments = await Comment.find({ 
      comic: req.params.comicId,
      parentComment: null 
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentsByChapter = async (req, res) => {
  try {
    const comments = await Comment.find({ 
      chapter: req.params.chapterId,
      parentComment: null 
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReplies = async (req, res) => {
  try {
    const replies = await Comment.find({ parentComment: req.params.commentId })
      .populate('user', 'username avatar')
      .sort({ createdAt: 1 });
    
    res.json(replies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.content !== undefined) {
      comment.content = req.body.content;
    }
    if (req.body.rating !== undefined) {
      comment.rating = req.body.rating;
    }
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar');

    res.json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};