export function isEndWord(text) {
    const endPhrases = [
      "stop",
      "go to sleep",
      "that's all",
      "thank you that's it",
      "exit",
      "bye"
    ];
  
    text = text.toLowerCase();
    return endPhrases.some(p => text.includes(p));
  }
  