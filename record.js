import mic from "mic";
import fs from "fs";

export function recordAudio() {
  return new Promise((resolve) => {
    const micInstance = mic({
      rate: "16000",
      channels: "1",
      fileType: "wav",
      silence: "0",
      exitOnSilence: 0
    });

    const micInputStream = micInstance.getAudioStream();
    const outputFileStream = fs.createWriteStream("command.wav");
    micInputStream.pipe(outputFileStream);

    // ---- STATE ----
    let listenStartTime = null;
    let lastVoiceTime = null;
    let startedSpeaking = false;
    let hasStopped = false;

    // ---- TUNING ----
    const INITIAL_GRACE_TIME = 3000; // ⏳ 3 seconds to think
    const SILENCE_TIMEOUT = 5000;    // ⏱ 5 sec after speech
    const VOICE_THRESHOLD = 0.01;

    micInputStream.on("data", (chunk) => {
      if (hasStopped) return;

      // Start clock ONLY when mic is truly live
      if (!listenStartTime) {
        listenStartTime = Date.now();
        console.log("🎧 Mic live — take your time...");
      }

      const now = Date.now();

      // ---- GRACE PHASE ----
      if (!startedSpeaking && now - listenStartTime < INITIAL_GRACE_TIME) {
        return; // ignore everything
      }

      // ---- VOICE ENERGY ----
      let sum = 0;
      for (let i = 0; i < chunk.length; i += 2) {
        const sample = chunk.readInt16LE(i) / 32768;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / (chunk.length / 2));

      // ---- SPEECH DETECTION ----
      if (rms > VOICE_THRESHOLD) {
        if (!startedSpeaking) {
          console.log("🗣 Speech started");
          startedSpeaking = true;
        }
        lastVoiceTime = now;
      }

      // ---- END OF SPEECH ----
      if (
        startedSpeaking &&
        lastVoiceTime &&
        now - lastVoiceTime > SILENCE_TIMEOUT
      ) {
        hasStopped = true;
        console.log("🛑 End of speech");
        micInstance.stop();
      }
    });

    micInputStream.on("stopComplete", () => {
      resolve();
    });

    console.log("🎙 Listening… you can pause before speaking");
    micInstance.start();
  });
}