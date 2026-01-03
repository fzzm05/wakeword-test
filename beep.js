import { exec } from "child_process";

export function beep() {
  exec('afplay /System/Library/Sounds/Ping.aiff');
}
