import type { PersonalityQuiz, PersonalityResponse } from "@prisma/client";

export const PERSONALITY_WORD_POOL = [
  "Adaptable",
  "Adventurous",
  "Analytical",
  "Articulate",
  "Authentic",
  "Bold",
  "Calm",
  "Candid",
  "Caring",
  "Charismatic",
  "Cheerful",
  "Clever",
  "Compassionate",
  "Confident",
  "Conscientious",
  "Creative",
  "Curious",
  "Dependable",
  "Determined",
  "Diplomatic",
  "Disciplined",
  "Easygoing",
  "Empathetic",
  "Encouraging",
  "Energetic",
  "Focused",
  "Friendly",
  "Funny",
  "Generous",
  "Gentle",
  "Grounded",
  "Helpful",
  "Honest",
  "Imaginative",
  "Independent",
  "Insightful",
  "Intelligent",
  "Intuitive",
  "Kind",
  "Level-headed",
  "Loyal",
  "Open-minded",
  "Optimistic",
  "Organized",
  "Patient",
  "Perceptive",
  "Playful",
  "Practical",
  "Reliable",
  "Resilient",
  "Resourceful",
  "Self-aware",
  "Sincere",
  "Sociable",
  "Spontaneous",
  "Steady",
  "Supportive",
  "Thoughtful",
  "Trustworthy",
  "Warm",
  "Wise",
  "Witty",
];

export const DEFAULT_RESPONDER_INSTRUCTIONS =
  "Pick the words that genuinely feel most true of this person. Don’t overthink it, choose the words that fit best.";

export const DEFAULT_SELECTION_COUNT = 10;

export type PersonalityQuizWithResponses = PersonalityQuiz & {
  responses: PersonalityResponse[];
};

export interface PersonalityWordResult {
  word: string;
  selfSelected: boolean;
  otherCount: number;
}

export function sanitizeSelectionCount(value: unknown, max = PERSONALITY_WORD_POOL.length) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_SELECTION_COUNT;
  return Math.min(Math.max(parsed, 1), max - 1);
}

export function normalizeSelectedWords(words: unknown, wordPool: string[], requiredCount: number) {
  if (!Array.isArray(words)) {
    throw new Error("Selected words must be an array");
  }

  const allowed = new Set(wordPool);
  const cleaned = Array.from(
    new Set(
      words
        .filter((word): word is string => typeof word === "string")
        .map((word) => word.trim())
        .filter((word) => allowed.has(word))
    )
  ).sort((a, b) => a.localeCompare(b));

  if (cleaned.length !== requiredCount) {
    throw new Error(`You must choose exactly ${requiredCount} words`);
  }

  return cleaned;
}

export function buildPersonalityResults(quiz: PersonalityQuizWithResponses) {
  const counts = new Map<string, number>();

  for (const word of quiz.wordPool) {
    counts.set(word, 0);
  }

  for (const response of quiz.responses) {
    for (const word of response.selectedWords) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  const words: PersonalityWordResult[] = quiz.wordPool
    .map((word) => ({
      word,
      selfSelected: quiz.selfWords.includes(word),
      otherCount: counts.get(word) ?? 0,
    }))
    .sort((a, b) => a.word.localeCompare(b.word));

  return {
    responseCount: quiz.responses.length,
    buckets: {
      both: words.filter((word) => word.selfSelected && word.otherCount > 0),
      selfOnly: words.filter((word) => word.selfSelected && word.otherCount === 0),
      othersOnly: words.filter((word) => !word.selfSelected && word.otherCount > 0),
      nobody: words.filter((word) => !word.selfSelected && word.otherCount === 0),
    },
  };
}
