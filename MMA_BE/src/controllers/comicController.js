import { Comic, Chapter, ComicLike, Comment } from "../models/index.js";

const getChapterContextText = (chapters, currentChapterNumber) => {
  const filteredChapters =
    typeof currentChapterNumber === "number"
      ? chapters.filter((ch) => ch.chapterNumber <= currentChapterNumber)
      : chapters;

  if (!filteredChapters.length) {
    return "No chapter data available.";
  }

  return filteredChapters
    .map(
      (ch) => `- Chapter ${ch.chapterNumber}${ch.title ? `: ${ch.title}` : ""}`,
    )
    .join("\n");
};

const generateGeminiText = async (apiKey, prompt) => {
  const response = await fetch(`${process.env.AI_MODEL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      tools: [
        {
          google_search: {},
        },
      ],

      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 700,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "No response generated."
  );
};

const buildComicQueryAndSort = (query, filters) => {
  const { status, search, sort, minViews, maxViews } = filters;

  if (status) query.status = status;
  if (search) query.title = { $regex: search, $options: "i" };

  if (minViews || maxViews) {
    query.views = {};
    if (minViews) query.views.$gte = parseInt(minViews);
    if (maxViews) query.views.$lte = parseInt(maxViews);
  }

  let sortOption = { createdAt: -1 };
  if (sort === "viewsDesc") sortOption = { views: -1 };
  else if (sort === "viewsAsc") sortOption = { views: 1 };
  else if (sort === "oldest") sortOption = { createdAt: 1 };
  else if (sort === "latest") sortOption = { createdAt: -1 };
  else if (sort === "az") sortOption = { title: 1 };
  else if (sort === "za") sortOption = { title: -1 };
  else if (sort === "likesDesc") sortOption = { likes: -1 };
  else if (sort === "likesAsc") sortOption = { likes: 1 };

  return sortOption;
};

export const createComic = async (req, res) => {
  try {
    const comic = await Comic.create(req.body);
    res.status(201).json(comic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllComics = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { genres } = req.query;

    const query = {};
    if (genres) {
      query.genres = { $in: genres.split(",") };
    }

    const sortOption = buildComicQueryAndSort(query, req.query);

    const comics = await Comic.find(query)
      .populate("genres")
      .limit(limit)
      .skip((page - 1) * limit)
      .sort(sortOption)
      .lean();

    const count = await Comic.countDocuments(query);

    const comicIds = comics.map((c) => c._id);
    const chapterCounts = await Chapter.aggregate([
      { $match: { comic: { $in: comicIds } } },
      { $group: { _id: "$comic", total: { $sum: 1 } } },
    ]);
    const chapterCountMap = Object.fromEntries(
      chapterCounts.map(({ _id, total }) => [_id.toString(), total]),
    );

    res.json({
      comics: comics.map((comic) => ({
        ...comic,
        totalChapters: chapterCountMap[comic._id.toString()] ?? 0,
      })),
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getComicById = async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id).populate("genres").lean();

    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    const chapters = await Chapter.find({
      comic: comic._id,
    })
      .select({ title: 1, chapterNumber: 1 })
      .sort({ chapterNumber: "asc" })
      .lean();

    // Calculate average rating from comments
    const ratingAgg = await Comment.aggregate([
      { $match: { comic: comic._id, rating: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const rating = ratingAgg.length > 0 ? ratingAgg[0].avgRating : 0;
    const ratingCount = ratingAgg.length > 0 ? ratingAgg[0].count : 0;

    res.json({
      ...comic,
      chapters,
      rating: Math.round(rating * 10) / 10,
      ratingCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getComicBySlug = async (req, res) => {
  try {
    const comic = await Comic.findOne({ slug: req.params.slug }).populate(
      "genres",
    );

    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    comic.views += 1;
    await comic.save();

    res.json(comic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComic = async (req, res) => {
  try {
    const comic = await Comic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("genres");

    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    res.json(comic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComic = async (req, res) => {
  try {
    const comic = await Comic.findByIdAndDelete(req.params.id);

    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    res.json({ message: "Comic deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getComicsByGenreId = async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = { genres: genreId };

    const sortOption = buildComicQueryAndSort(query, req.query);

    const comics = await Comic.find(query)
      .populate("genres")
      .limit(limit)
      .skip((page - 1) * limit)
      .sort(sortOption);

    const comicIds = comics.map((c) => c._id);
    const chapters = await Chapter.find({ comic: { $in: comicIds } }).select(
      "comic",
    );

    const comicsWithChapters = comics.map((comic) => {
      const totalChapters = chapters.filter(
        (c) => c.comic.toString() === comic._id.toString(),
      ).length;
      return {
        ...comic.toObject(),
        totalChapters,
      };
    });

    const count = await Comic.countDocuments(query);

    res.json({
      comics: comicsWithChapters,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const likeComic = async (req, res) => {
  try {
    const { comicId } = req.params;

    const existingLike = await ComicLike.findOne({
      user: req.user._id,
      comic: comicId,
    });

    if (existingLike) {
      await existingLike.deleteOne();
      await Comic.findByIdAndUpdate(comicId, { $inc: { likes: -1 } });
      return res.json({ message: "Comic unliked" });
    }

    await ComicLike.create({ user: req.user._id, comic: comicId });
    await Comic.findByIdAndUpdate(comicId, { $inc: { likes: 1 } });

    res.json({ message: "Comic liked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLikedComics = async (req, res) => {
  try {
    const likes = await ComicLike.find({ user: req.user._id })
      .populate("comic")
      .sort({ createdAt: -1 });

    res.json(likes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const askReaderChatbot = async (req, res) => {
  try {
    const { comicId } = req.params;
    const { message, currentChapterNumber } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const comic = await Comic.findById(comicId)
      .select({
        title: 1,
        description: 1,
        author: 1,
        artist: 1,
        status: 1,
        slug: 1,
      })
      .lean();

    if (!comic) {
      return res.status(404).json({ message: "Comic not found" });
    }

    const chapters = await Chapter.find({ comic: comic._id })
      .select({ chapterNumber: 1, title: 1, createdAt: 1 })
      .sort({ chapterNumber: 1 })
      .lean();

    const normalizedCurrentChapter = Number.isFinite(
      Number(currentChapterNumber),
    )
      ? Number(currentChapterNumber)
      : undefined;

    const chapterContext = getChapterContextText(
      chapters,
      normalizedCurrentChapter,
    );
    const chapterScope =
      typeof normalizedCurrentChapter === "number"
        ? `up to chapter ${normalizedCurrentChapter}`
        : "all available chapters";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "GEMINI_API_KEY is not configured" });
    }

    const basePrompt = `You are a helpful manga reading assistant inside a manga reading app.

The user is asking about this manga.

Manga info:
- Title: ${comic.title}
- Slug: ${comic.slug}
- Author: ${comic.author || "Unknown"}
- Artist: ${comic.artist || "Unknown"}
- Status: ${comic.status || "Unknown"}
- Description: ${comic.description || "No description available"}

Chapter scope: ${chapterScope}

Chapter list:
${chapterContext}

Important context:
- Chapter pages are stored as images, so the detailed story content of each chapter may not be available.
- If the user asks about the story, characters, or events, you are allowed to search for summaries and information about this manga from reliable online sources (such as manga databases, fandom wikis, or official summaries).

User question:
"${message.trim()}"

Rules:
- Prefer accurate summaries from reliable sources.
- Do not invent events or story details.
- If exact chapter details are unknown, provide a general story summary instead.
- If spoilers are involved, warn the user first.
- Keep answers concise and easy to read.
`;

    const viPrompt = `${basePrompt}\nRespond in Vietnamese.`;
    const enPrompt = `${basePrompt}\nRespond in English.`;

    const [vi, en] = await Promise.all([
      generateGeminiText(apiKey, viPrompt),
      generateGeminiText(apiKey, enPrompt),
    ]);

    res.json({
      comicId,
      message: message.trim(),
      currentChapterNumber: normalizedCurrentChapter,
      responses: {
        vi,
        en,
      },
      metadata: {
        model: "gemini-2.0-flash",
        chapterCountUsed:
          typeof normalizedCurrentChapter === "number"
            ? chapters.filter(
                (ch) => ch.chapterNumber <= normalizedCurrentChapter,
              ).length
            : chapters.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
