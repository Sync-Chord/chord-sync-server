import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname in an ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fetchSongStream = (data) => {
  const songPath = path.join(__dirname, `../../music/${data.songId}.mp3`);

  if (!fs.existsSync(songPath)) {
    throw new Error("Song not found");
  }

  const stat = fs.statSync(songPath);
  const fileSize = stat.size;
  const range = data.range;

  let start = 0;
  let end = fileSize - 1;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    start = parseInt(parts[0], 10);
    end = parts[1] ? parseInt(parts[1], 10) : end;

    if (start >= fileSize) {
      throw new Error("Requested range not satisfiable");
    }
  }

  const chunkSize = end - start + 1;
  const file = fs.createReadStream(songPath, { start, end });

  return { file, chunkSize, fileSize, start, end };
};
