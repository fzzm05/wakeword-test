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
    const outputFileStream = fs.createWriteStream("./recordings/command.wav");
    micInputStream.pipe(outputFileStream);

    // ---- STATE ----
    let stopReason = "speech_end";
    let startedSpeaking = false;
    let hasStopped = false;
    let lastVoiceTime = null;
    let bufferStartTime = Date.now();
    let bufferLogged = false;
    let voiceStart = null;

    // ---- CONFIG ----
    const INITIAL_BUFFER = 3000;       // 3s grace before silence logic
    const SILENCE_TIMEOUT = 5000;      // 5s after speech ends
    const MAX_IDLE_TIMEOUT = 15000;    // 15s max wait if user never speaks
    const VOICE_THRESHOLD = 0.01;      // voice energy threshold
    const SUSTAINED_SPEECH_MS = 500;   // must sustain voice for 200ms

    console.log("🎙 Listening… you can pause before speaking");

    micInputStream.on("data", (chunk) => {
      if (hasStopped) return;

      const now = Date.now();

      // ---- VOICE ENERGY ----
      let sum = 0;
      for (let i = 0; i < chunk.length; i += 2) {
        const sample = chunk.readInt16LE(i) / 32768;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / (chunk.length / 2));

      // ---- BUFFER LOGGING ----
      if (!bufferLogged && now - bufferStartTime >= INITIAL_BUFFER) {
        bufferLogged = true;
      }

      // ---- POTENTIAL SPEECH DETECTION ----
      if (!startedSpeaking && rms > VOICE_THRESHOLD) {
        if (!voiceStart) voiceStart = now;
        else if (now - voiceStart >= SUSTAINED_SPEECH_MS) {
          startedSpeaking = true;
          lastVoiceTime = now;
          console.log(
            now - bufferStartTime < INITIAL_BUFFER
              ? "🗣 Speech started immediately (during buffer)"
              : "🗣 Speech started (after buffer)"
          );
        }
      } else if (!startedSpeaking) {
        voiceStart = null; // reset if no sustained voice before speech
      }

      // ---- UPDATE LAST VOICE TIME ----
      if (startedSpeaking && rms > VOICE_THRESHOLD) {
        lastVoiceTime = now;
      }

      // ---- END OF SPEECH DETECTION ----
      if (
        startedSpeaking &&
        lastVoiceTime &&
        now - lastVoiceTime > SILENCE_TIMEOUT
      ) {
        hasStopped = true;
        console.log("🛑 End of speech");
        stopReason = "speech_end";
        micInstance.stop();
      }

      // ---- MAX IDLE (no speech detected at all) ----
      if (!startedSpeaking && now - bufferStartTime > MAX_IDLE_TIMEOUT) {
        hasStopped = true;
        console.log("🛑 Max idle reached — no speech detected");
        stopReason = "max_idle";
        micInstance.stop();
      }
    });

    micInputStream.on("stopComplete", () => {
      resolve({
        reason: stopReason
      });
    });

    micInstance.start();
  });
}
