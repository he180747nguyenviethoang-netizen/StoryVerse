import express from 'express';
import {
  getAllGenres,
  getGenreById,
} from '../controllers/genreController.js';

const router = express.Router();

/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get all genres
 *     tags: [Genres]
 *     responses:
 *       200:
 *         description: List of all genres
 */
router.get('/', getAllGenres);

/**
 * @swagger
 * /api/genres/{id}:
 *   get:
 *     summary: Get genre by ID
 *     tags: [Genres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Genre details
 *       404:
 *         description: Genre not found
 */
router.get('/:id', getGenreById);

export default router;
