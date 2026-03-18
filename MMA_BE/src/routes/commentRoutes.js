import express from 'express';
import {
    getCommentsByComic,
    getCommentsByChapter,
    getReplies,
} from '../controllers/commentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/comments/comic/{comicId}:
 *   get:
 *     summary: Get all comments for a comic
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/comic/:comicId', getCommentsByComic);

/**
 * @swagger
 * /api/comments/chapter/{chapterId}:
 *   get:
 *     summary: Get all comments for a chapter
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/chapter/:chapterId', getCommentsByChapter);

/**
 * @swagger
 * /api/comments/{commentId}/replies:
 *   get:
 *     summary: Get replies to a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of replies
 */
router.get('/:commentId/replies', getReplies);

export default router;
