import { exec } from "child_process";
import path from "path";

const WHISPER_BIN = path.resolve(
  "whisper.cpp/build/bin/whisper-cli"
);
const MODEL = path.resolve(
  "whisper.cpp/models/ggml-tiny.en.bin"
);

export function transcribe(audioPath) {
  return new Promise((resolve, reject) => {
    const cmd = `${WHISPER_BIN} -m ${MODEL} -f ${audioPath} --no-timestamps`;

    exec(cmd, (err, stdout) => {
      if (err) return reject(err);

      // Extract only spoken text
      const lines = stdout
        .split("\n")
        .filter(l => l.trim() && !l.includes("["))
        .join(" ");

      resolve(lines.trim());
    });
  });
}
