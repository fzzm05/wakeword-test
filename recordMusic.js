import mic from "mic";
import fs from "fs";

export function recordMusic(seconds = 10) {
  return new Promise((resolve) => {
    const micInstance = mic({
      rate: "44100",
      channels: "2",
      fileType: "wav",
      exitOnSilence: 0,
      silence: "0"
    });

    const stream = micInstance.getAudioStream();
    const output = fs.createWriteStream("music.wav");
    stream.pipe(output);

    stream.on('stopComplete', () => {
      output.end(); // Ensure the write stream is closed
      resolve();
    });

    micInstance.start();
    console.log("🎶 Listening for music...");

    setTimeout(() => {
      micInstance.stop();
      console.log("🛑 Music capture complete");
      // resolve();
    }, seconds * 1000);
  });
}
