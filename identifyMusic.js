import fs from "fs";
import { acr } from "./acrcloud.js";

export async function identifyMusic() {
  const buffer = fs.readFileSync("music.wav");

  const result = await acr.identify(buffer);
  if (!result.metadata || !result.metadata.music) {
    return null;
  }

  const song = result.metadata.music[0];

  return {
    title: song.title,
    artist: song.artists?.[0]?.name,
    album: song.album?.name,
    confidence: song.score
  };
}
