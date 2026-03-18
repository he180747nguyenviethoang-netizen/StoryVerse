import express from 'express';
import {
  createGenre,
  getAllGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
} from '../controllers/genreController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/genres:
 *   post:
 *     summary: Create a new genre (Admin only)
 *     tags: [Genres]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Genre created successfully
 *       403:
 *         description: Unauthorized
 */
router.post('/', protect, admin, createGenre);

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

/**
 * @swagger
 * /api/genres/{id}:
 *   put:
 *     summary: Update genre (Admin only)
 *     tags: [Genres]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Genre updated successfully
 *       403:
 *         description: Unauthorized
 */
router.put('/:id', protect, admin, updateGenre);

/**
 * @swagger
 * /api/genres/{id}:
 *   delete:
 *     summary: Delete genre (Admin only)
 *     tags: [Genres]
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
 *         description: Genre deleted successfully
 *       403:
 *         description: Unauthorized
 */
router.delete('/:id', protect, admin, deleteGenre);

export default router;