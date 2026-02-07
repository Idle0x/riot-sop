// src/utils/security.ts

const LEXICON = {
  actors: [
    "I am", "The System is", "Command Authority", "Protocol Zero", "Root User", 
    "Sovereign Entity", "The Architect", "Override Sequence", "Admin Force"
  ],
  actions: [
    "authorizing", "deploying", "wiping", "executing", "sanctioning", 
    "purging", "initializing", "terminating", "nullifying"
  ],
  intensities: [
    "immediate", "terminal", "irreversible", "sovereign", "absolute", 
    "total", "permanent", "binding", "final"
  ],
  targets: [
    "capital", "assets", "ledger", "sequence", "mainnet", 
    "database", "memory core", "financial stack", "black box"
  ],
  contexts: [
    "for re-initialization", "without delay", "under duress", "permanently", 
    "with full prejudice", "beyond recovery", "as authorized", "per protocol"
  ]
};

const glitchText = (text: string) => {
  return text.split('').map(char => {
    return Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase();
  }).join('');
};

export const generateSecurityPhrase = () => {
  // 1. Construct the Sentence (5 parts)
  const sentence = [
    LEXICON.actors[Math.floor(Math.random() * LEXICON.actors.length)],
    LEXICON.actions[Math.floor(Math.random() * LEXICON.actions.length)],
    LEXICON.intensities[Math.floor(Math.random() * LEXICON.intensities.length)],
    LEXICON.targets[Math.floor(Math.random() * LEXICON.targets.length)],
    LEXICON.contexts[Math.floor(Math.random() * LEXICON.contexts.length)]
  ].join(' ');

  // 2. Apply Chaos Mode
  const mode = Math.random();
  
  if (mode < 0.25) return sentence.toUpperCase(); // THE SCREAM
  if (mode < 0.50) return sentence.toLowerCase(); // THE WHISPER
  if (mode < 0.75) return glitchText(sentence);   // THE GLITCH
  
  return sentence; // THE STANDARD
};
