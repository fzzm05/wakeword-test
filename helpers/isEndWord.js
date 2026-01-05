export function isEndWord(text) {
  if (!text) return false;

  text = text.toLowerCase().trim();

  const endPhrases = [
    "stop",
    "go to sleep",
    "that's all",
    "thank you that's it",
    "exit",
    "bye",
    "goodbye"
  ];

  // Remove punctuation at the end
  const clean = text.replace(/[.!?]+$/, "");

  // If sentence is too long, assume it's NOT an exit intent
  if (clean.split(" ").length > 6) {
    console.log(clean.split(" "));
    return false;
  }

  for (const phrase of endPhrases) {
    // Case 1: Exact match
    if (clean === phrase) {
      return true;
    }

    // Case 2: Phrase at the very end
    if (clean.endsWith(" " + phrase)) {
      return true;
    }
  }

  return false;
}
