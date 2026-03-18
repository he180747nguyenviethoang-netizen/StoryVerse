import express from 'express';
import {
  getChaptersByComic,
  getChapterById,
} from '../controllers/chapterController.js';

const router = express.Router();

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

export default router;
