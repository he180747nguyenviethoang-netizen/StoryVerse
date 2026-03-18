import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import {
  Chapter,
  Comic,
  ComicLike,
  Comment,
  Genre,
  ReadingHistory,
  User,
} from "../models/index.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const hasFlag = (flag) => process.argv.includes(flag);

const upsertOne = async (Model, filter, update) =>
  Model.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

const main = async () => {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment (.env).");
  }

  await mongoose.connect(MONGODB_URI);

  const shouldDrop = hasFlag("--drop") || hasFlag("-d");
  if (shouldDrop) {
    await Promise.all([
      ComicLike.deleteMany({}),
      Comment.deleteMany({}),
      ReadingHistory.deleteMany({}),
      Chapter.deleteMany({}),
      Comic.deleteMany({}),
      Genre.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  const action = await upsertOne(
    Genre,
    { slug: "action" },
    {
      $set: {
        name: "Action",
        slug: "action",
      },
    },
  );

  const romance = await upsertOne(
    Genre,
    { slug: "romance" },
    {
      $set: {
        name: "Romance",
        slug: "romance",
      },
    },
  );

  const fantasy = await upsertOne(
    Genre,
    { slug: "fantasy" },
    {
      $set: {
        name: "Fantasy",
        slug: "fantasy",
      },
    },
  );

  const comic = await upsertOne(
    Comic,
    { slug: "demo-comic" },
    {
      $set: {
        title: "Demo Comic",
        slug: "demo-comic",
        description: "Seed data for local development/testing.",
        coverImage: "https://example.com/demo-cover.jpg",
        author: "StoryVerse",
        artist: "StoryVerse",
        status: "ongoing",
        genres: [action._id, romance._id, fantasy._id],
        isPublished: true,
      },
    },
  );

  const chapter1 = await upsertOne(
    Chapter,
    { comic: comic._id, chapterNumber: 1 },
    {
      $set: {
        comic: comic._id,
        chapterNumber: 1,
        title: "Chapter 1",
        isPublished: true,
        pages: [
          { pageNumber: 1, imageUrl: "https://example.com/demo/1/1.jpg" },
          { pageNumber: 2, imageUrl: "https://example.com/demo/1/2.jpg" },
          { pageNumber: 3, imageUrl: "https://example.com/demo/1/3.jpg" },
        ],
      },
    },
  );

  const chapter2 = await upsertOne(
    Chapter,
    { comic: comic._id, chapterNumber: 2 },
    {
      $set: {
        comic: comic._id,
        chapterNumber: 2,
        title: "Chapter 2",
        isPublished: true,
        pages: [
          { pageNumber: 1, imageUrl: "https://example.com/demo/2/1.jpg" },
          { pageNumber: 2, imageUrl: "https://example.com/demo/2/2.jpg" },
        ],
      },
    },
  );

  await Comic.updateOne(
    { _id: comic._id },
    { $addToSet: { chapters: { $each: [chapter1._id, chapter2._id] } } },
  );

  const seededUserPassword = await bcrypt.hash("123456", 10);
  const user = await upsertOne(
    User,
    { email: "demo@storyverse.local" },
    {
      $set: {
        username: "demo",
        email: "demo@storyverse.local",
        password: seededUserPassword,
        isVerified: true,
        role: "user",
        isActive: true,
      },
    },
  );

  const comment = await upsertOne(
    Comment,
    { user: user._id, chapter: chapter1._id, content: "Hay quá!" },
    {
      $set: {
        user: user._id,
        comic: comic._id,
        chapter: chapter1._id,
        content: "Hay quá!",
        rating: 5,
      },
    },
  );

  await upsertOne(
    ReadingHistory,
    { user: user._id, comic: comic._id },
    {
      $set: {
        user: user._id,
        comic: comic._id,
        chapter: chapter2._id,
      },
    },
  );

  await upsertOne(
    ComicLike,
    { user: user._id, comic: comic._id },
    {
      $set: {
        user: user._id,
        comic: comic._id,
      },
    },
  );

  await User.updateOne(
    { _id: user._id },
    { $addToSet: { favorites: comic._id } },
  );

  console.log("Seed done:", {
    drop: shouldDrop,
    userId: user._id.toString(),
    comicId: comic._id.toString(),
    chapterIds: [chapter1._id.toString(), chapter2._id.toString()],
    commentId: comment._id.toString(),
  });

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

