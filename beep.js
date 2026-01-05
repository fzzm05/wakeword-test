import { exec } from "child_process";

export function beep() {
  exec('afplay /System/Library/Sounds/Submarine.aiff');
}

export function boop() {
  exec('afplay /System/Library/Sounds/Pop.aiff');
}
