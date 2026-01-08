import { Porcupine } from "@picovoice/porcupine-node";
import mic from "mic";
import { beep, boop } from "./beep.js";
import { exec } from "child_process";
import { transcribe } from "./transcribe.js";
import { recordAudio } from "./record.js";
import {isEndWord} from "./helpers/isEndWord.js";
import { recordMusic } from "./recordMusic.js";
import { identifyMusic } from "./identifyMusic.js";

const ACCESS_KEY = process.env.PICOVOICE_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error("❌ PICOVOICE_ACCESS_KEY not set");
  process.exit(1);
}

const porcupine = new Porcupine(
  ACCESS_KEY,
  ["./models/salaam_en_mac_v4_0_0.ppn"],
  [0.6]
);

const micInstance = mic({
  rate: "16000",
  channels: "1",
  debug: false,
  exitOnSilence: false,
  recorder: "rec",
  recorderPath: "/opt/homebrew/bin/rec"
});

const stream = micInstance.getAudioStream();
let audioBuffer = [];

// --- Flag to prevent multiple triggers ---
let isProcessing = false;

stream.on("data", async (data) => {
  if (isProcessing) return;

  const pcm = new Int16Array(data.buffer);

  for (let i = 0; i < pcm.length; i++) {
    audioBuffer.push(pcm[i]);

    if (audioBuffer.length === porcupine.frameLength) {
      const frame = new Int16Array(audioBuffer);
      audioBuffer = [];

      const keywordIndex = porcupine.process(frame);
      if (keywordIndex >= 0) {
        console.log("🔥 Wake word detected");
        beep();

        isProcessing = true;

        try {
          while (true) {
            // 1️⃣ Record user speech
            micInstance.pause();
            const result = await recordAudio();
            micInstance.resume();

            if (result.reason === "max_idle") {
              console.log("🔁 Idle timeout — returning to wake word mode");
              console.log("🎤 Listening... say your wake word");
              boop();
              break; // exit conversation loop
            }

            // 2️⃣ Convert audio
            await new Promise((resolve, reject) => {
              exec(
                "ffmpeg -y -i ./recordings/command.wav -ar 16000 -ac 1 -c:a pcm_s16le ./recordings/command_fixed.wav",
                (err) => (err ? reject(err) : resolve())
              );
            });

            // 3️⃣ Transcribe
            const text = await transcribe("./recordings/command_fixed.wav");
            console.log("🧠 You said:", text);

            const t = text.toLowerCase();
            const wantsSongId =
              t.includes("what song") ||
              t.includes("what music") ||
              t.includes("which song") ||
              t.includes("identify this song") ||
              t.includes("what is playing") ||
              t.includes("identify this music") ||
              t.includes("identify the song") ||
              t.includes("identify the music");

            // 3️⃣a Music identification
            if (wantsSongId) {
              micInstance.pause();
              await recordMusic(10);
              micInstance.resume();
              console.log("🎧 Identifying music...");
              const song = await identifyMusic();

              if (!song) {
                console.log("❌ Couldn't identify the song");
              } else {
                console.log(
                  `🎵 ${song.title} by ${song.artist} (${song.confidence}%)`
                );
              }
            }

            // 4️⃣ Exit condition
            if (isEndWord(text)) {
              console.log("👋 Ending session");
              console.log("🎤 Listening... say your wake word");
              break; // exit conversation loop
            }
            
            console.log("🎙 Listening for next command… (no wake word needed)");
          }
        } catch (err) {
          console.error(err);
        } finally {
          isProcessing = false;
        }
      }
    }
  }
});

micInstance.start();
console.log("🎤 Listening... say your wake word");

process.on("SIGINT", () => {
  porcupine.release();
  micInstance.stop();
  process.exit();
});