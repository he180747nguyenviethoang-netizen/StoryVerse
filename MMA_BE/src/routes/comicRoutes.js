import express from "express";
import {
  getAllComics,
  getComicById,
  getComicBySlug,
  getComicsByGenreId,
} from "../controllers/comicController.js";

const router = express.Router();

/**
 * @swagger
 * /api/comics:
 *   get:
 *     summary: Get all comics
 *     tags: [Comics]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comics
 */
router.get("/", getAllComics);

/**
 * @swagger
 * /api/comics/{id}:
 *   get:
 *     summary: Get comic by ID
 *     tags: [Comics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comic details
 *       404:
 *         description: Comic not found
 */
router.get("/:id", getComicById);

/**
 * @swagger
 * /api/comics/slug/{slug}:
 *   get:
 *     summary: Get comic by slug
 *     tags: [Comics]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comic details
 *       404:
 *         description: Comic not found
 */
router.get("/slug/:slug", getComicBySlug);

/**
 * @swagger
 * /api/comics/genre/{genreId}:
 *   get:
 *     summary: Get all comics by genre ID
 *     tags: [Comics]
 *     parameters:
 *       - in: path
 *         name: genreId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of comics in genre
 *       404:
 *         description: Genre not found
 */
router.get("/genre/:genreId", getComicsByGenreId);

export default router;
