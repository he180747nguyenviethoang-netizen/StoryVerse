import fs from "fs/promises";
import path from "path";

import dotenv from "dotenv";
import mongoose from "mongoose";
import { EJSON } from "bson";

import { Chapter, Comic, Genre, User } from "./models/index.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const getArgValue = (name) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) return null;
  return value;
};

const hasFlag = (flag) => process.argv.includes(flag);

const normalizeFilePath = (p) => {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
};

const fileExists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const parseDump = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Supports MongoDB extended JSON ($oid/$date...) via EJSON.parse.
  const parsed = EJSON.parse(trimmed);

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.documents)) return parsed.documents;
  if (Array.isArray(parsed?.data)) return parsed.data;

  throw new Error("Unsupported dump format (expected a JSON array).");
};

const bulkUpsertById = async (Model, docs, batchSize = 1000) => {
  if (!docs.length) return { upserted: 0, modified: 0 };

  let upserted = 0;
  let modified = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const ops = batch.map((doc) => {
      if (doc && doc._id) {
        return {
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true,
          },
        };
      }
      return { insertOne: { document: doc } };
    });

    const res = await Model.collection.bulkWrite(ops, { ordered: false });

    upserted += res.upsertedCount ?? 0;
    modified += res.modifiedCount ?? 0;
  }

  return { upserted, modified };
};

const importCollection = async (label, Model, filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  const docs = parseDump(raw);

  const { upserted, modified } = await bulkUpsertById(Model, docs);

  console.log(
    `Imported ${label}: docs=${docs.length}, upserted=${upserted}, modified=${modified}`,
  );
};

const main = async () => {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment (.env).");
  }

  const defaultFiles = {
    genres: "D:\\SP26\\MMA\\comicDB.genres.json",
    comics: "D:\\SP26\\MMA\\comicDB.comics.json",
    chapters: "D:\\SP26\\MMA\\comicDB.chapters.json",
    users: "D:\\SP26\\MMA\\comicDB.users.json",
  };

  const genresFile = normalizeFilePath(getArgValue("--genres") || defaultFiles.genres);
  const comicsFile = normalizeFilePath(getArgValue("--comics") || defaultFiles.comics);
  const chaptersFile = normalizeFilePath(
    getArgValue("--chapters") || defaultFiles.chapters,
  );
  const usersFile = normalizeFilePath(getArgValue("--users") || defaultFiles.users);

  const missing = [];
  for (const [k, v] of Object.entries({
    genres: genresFile,
    comics: comicsFile,
    chapters: chaptersFile,
    users: usersFile,
  })) {
    if (!(await fileExists(v))) missing.push(`${k}=${v}`);
  }

  if (missing.length) {
    throw new Error(
      `Missing dump file(s): ${missing.join(
        ", ",
      )}\nPass explicit paths, e.g. node src/importDump.js --genres <path> --comics <path> --chapters <path> --users <path>`,
    );
  }

  await mongoose.connect(MONGODB_URI);

  const shouldDrop = hasFlag("--drop") || hasFlag("-d");
  if (shouldDrop) {
    await Promise.all([
      Chapter.deleteMany({}),
      Comic.deleteMany({}),
      Genre.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  // Order matters a bit for references (genres -> comics -> chapters)
  await importCollection("genres", Genre, genresFile);
  await importCollection("comics", Comic, comicsFile);
  await importCollection("chapters", Chapter, chaptersFile);
  await importCollection("users", User, usersFile);

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error(err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
