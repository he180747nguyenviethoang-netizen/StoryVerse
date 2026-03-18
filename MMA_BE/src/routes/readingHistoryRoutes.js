import express from 'express';
import {
  updateReadingHistory,
  getReadingHistory,
  deleteReadingHistory,
} from '../controllers/readingHistoryController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/reading-history:
 *   post:
 *     summary: Update reading history
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comicId, chapterId]
 *             properties:
 *               comicId:
 *                 type: string
 *               chapterId:
 *                 type: string
 *               progress:
 *                 type: number
 *     responses:
 *       200:
 *         description: Reading history updated
 *       401:
 *         description: Not authenticated
 */
router.post('/', protect, updateReadingHistory);

/**
 * @swagger
 * /api/reading-history:
 *   get:
 *     summary: Get user's reading history
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reading history entries
 *       401:
 *         description: Not authenticated
 */
router.get('/', protect, getReadingHistory);

/**
 * @swagger
 * /api/reading-history/{comicId}:
 *   delete:
 *     summary: Delete reading history entry
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reading history deleted
 *       401:
 *         description: Not authenticated
 */
router.delete('/:comicId', protect, deleteReadingHistory);

export default router;