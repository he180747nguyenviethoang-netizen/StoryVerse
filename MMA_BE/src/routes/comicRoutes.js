import express from "express";
import {
  createComic,
  getAllComics,
  getComicById,
  getComicBySlug,
  getComicsByGenreId,
  updateComic,
  deleteComic,
  likeComic,
  getLikedComics,
  askReaderChatbot,
  getRecommendedComics,
} from "../controllers/comicController.js";
import { protect, admin } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/comics:
 *   post:
 *     summary: Create a new comic (Admin only)
 *     tags: [Comics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               author:
 *                 type: string
 *               coverImage:
 *                 type: string
 *               genreId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comic created successfully
 *       403:
 *         description: Unauthorized
 */
router.post("/", protect, admin, createComic);

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

router.get("/like", protect, getLikedComics);

/**
 * @swagger
 * /api/comics/recommend:
 *   post:
 *     summary: Get AI-recommended comics based on reading history
 *     tags: [Comics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comicIds]
 *             properties:
 *               comicIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60d5f9b4b5e4a23d4c8e4b1a", "60d5f9b4b5e4a23d4c8e4b1b"]
 *     responses:
 *       200:
 *         description: List of recommended comics
 *       400:
 *         description: Invalid comicIds
 *       401:
 *         description: Not authenticated
 */
router.post("/recommend", protect, getRecommendedComics);

/**
 * @swagger
 * /api/comics/{comicId}/reader-chatbot:
 *   post:
 *     summary: Ask AI reader chatbot about a manga (returns Vietnamese and English answers)
 *     tags: [Comics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: what happened from the beginning until current chapter?
 *               currentChapterNumber:
 *                 type: number
 *                 example: 120
 *     responses:
 *       200:
 *         description: Bilingual chatbot response
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Comic not found
 */
router.post("/:comicId/reader-chatbot", protect, askReaderChatbot);

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

/**
 * @swagger
 * /api/comics/{id}:
 *   put:
 *     summary: Update comic (Admin only)
 *     tags: [Comics]
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
 *         description: Comic updated successfully
 *       403:
 *         description: Unauthorized
 */
router.put("/:id", protect, admin, updateComic);

/**
 * @swagger
 * /api/comics/{id}:
 *   delete:
 *     summary: Delete comic (Admin only)
 *     tags: [Comics]
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
 *         description: Comic deleted successfully
 *       403:
 *         description: Unauthorized
 */
router.delete("/:id", protect, admin, deleteComic);

/**
 * @swagger
 * /api/comics/{comicId}/like:
 *   post:
 *     summary: Like a comic
 *     tags: [Comics]
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
 *         description: Comic liked successfully
 *       401:
 *         description: Not authenticated
 */
router.post("/:comicId/like", protect, likeComic);

export default router;
