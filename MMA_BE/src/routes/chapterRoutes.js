import express from 'express';
import {
  createChapter,
  getChaptersByComic,
  getChapterById,
  updateChapter,
  deleteChapter,
} from '../controllers/chapterController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/chapters:
 *   post:
 *     summary: Create a new chapter (Admin only)
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, comicId]
 *             properties:
 *               title:
 *                 type: string
 *               comicId:
 *                 type: string
 *               content:
 *                 type: string
 *               chapterNumber:
 *                 type: number
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *       403:
 *         description: Unauthorized
 */
router.post('/', protect, admin, createChapter);

/**
 * @swagger
 * /api/chapters/comic/{comicId}:
 *   get:
 *     summary: Get all chapters for a comic
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of chapters
 */
router.get('/comic/:comicId', getChaptersByComic);

/**
 * @swagger
 * /api/chapters/{id}:
 *   get:
 *     summary: Get chapter by ID
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chapter details
 *       404:
 *         description: Chapter not found
 */
router.get('/:id', getChapterById);

/**
 * @swagger
 * /api/chapters/{id}:
 *   put:
 *     summary: Update chapter (Admin only)
 *     tags: [Chapters]
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
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 *       403:
 *         description: Unauthorized
 */
router.put('/:id', protect, admin, updateChapter);

/**
 * @swagger
 * /api/chapters/{id}:
 *   delete:
 *     summary: Delete chapter (Admin only)
 *     tags: [Chapters]
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
 *         description: Chapter deleted successfully
 *       403:
 *         description: Unauthorized
 */
router.delete('/:id', protect, admin, deleteChapter);

export default router;