
import mongoose from "mongoose";

/* ===================== USER ===================== */
const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },

        avatar: String,
        role: { type: String, enum: ["user", "admin"], default: "user" },

        favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comic" }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

/* ===================== GENRE ===================== */
const genreSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    crawlLink: { type: String },
});

/* ===================== COMIC ===================== */
const comicSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },

        description: String,
        coverImage: String,

        author: String,
        artist: String,

        status: {
            type: String,
            enum: ["ongoing", "completed", "hiatus"],
            default: "ongoing",
        },

        genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
        chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],

        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },

        isPublished: { type: Boolean, default: true },

        crawlLink: { type: String },
    },
    { timestamps: true }
);

/* ===================== PAGE (Embedded) ===================== */
const pageSchema = new mongoose.Schema(
    {
        pageNumber: { type: Number, required: true },
        imageUrl: { type: String, required: true },
    },
    { _id: false }
);

/* ===================== CHAPTER ===================== */
const chapterSchema = new mongoose.Schema(
    {
        comic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comic",
            required: true,
        },

        chapterNumber: { type: Number, required: true },
        title: String,

        pages: [pageSchema],

        views: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },

        crawlLink: { type: String },
    },
    { timestamps: true }
);

chapterSchema.index({ comic: 1, chapterNumber: 1 }, { unique: true });

chapterSchema.pre("save", function (next) {
    if (this.pages?.length) {
        this.pages.sort((a, b) => a.pageNumber - b.pageNumber);
    }
    next();
});

/* ===================== COMMENT ===================== */
const commentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        comic: { type: mongoose.Schema.Types.ObjectId, ref: "Comic" },
        chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },

        content: { type: String, required: true },

        rating: { type: Number, min: 1, max: 5 },

        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },
    },
    { timestamps: true }
);

/* ===================== READING HISTORY ===================== */
const readingHistorySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        comic: { type: mongoose.Schema.Types.ObjectId, ref: "Comic", required: true },
        chapter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
        },
    },
    { timestamps: true }
);

readingHistorySchema.index({ user: 1, comic: 1 }, { unique: true });

/* ===================== LIKES ===================== */
const comicLikeSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        comic: { type: mongoose.Schema.Types.ObjectId, ref: "Comic", required: true },
    },
    { timestamps: true }
);

comicLikeSchema.index({ user: 1, comic: 1 }, { unique: true });

/* ===================== EXPORT ===================== */
export const User = mongoose.model("User", userSchema);
export const Genre = mongoose.model("Genre", genreSchema);
export const Comic = mongoose.model("Comic", comicSchema);
export const Chapter = mongoose.model("Chapter", chapterSchema);
export const Comment = mongoose.model("Comment", commentSchema);
export const ReadingHistory = mongoose.model(
    "ReadingHistory",
    readingHistorySchema
);
export const ComicLike = mongoose.model("ComicLike", comicLikeSchema);