import express from 'express';
import {
    createComment,
    getCommentsByComic,
    getCommentsByChapter,
    getReplies,
    updateComment,
    deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *               comicId:
 *                 type: string
 *               chapterId:
 *                 type: string
 *               parentCommentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/', protect, createComment);

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

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Not authenticated
 */
router.put('/:id', protect, updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Not authenticated
 */
router.delete('/:id', protect, deleteComment);

export default router;