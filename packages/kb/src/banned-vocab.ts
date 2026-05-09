export const BANNED_VOCAB_PATTERNS: readonly RegExp[] = [
  /clinic/i,
  /hospital/i,
  /patient/i,
  /medical/i,
  /appointment/i,
  /병원/,
  /환자/,
  /진료/,
  /예약/,
  /의료/,
  /HandDoc/i,
  /Re:?putation/i,
  /\bNMOS\b/i
];

export type BannedVocabHit = {
  readonly pattern: string;
  readonly index: number;
};

export function findBannedVocabHits(text: string): readonly BannedVocabHit[] {
  const hits: BannedVocabHit[] = [];
  for (const pattern of BANNED_VOCAB_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      hits.push({ pattern: pattern.source, index: match.index });
    }
  }
  return hits;
}

export function assertNoBannedVocab(text: string, where: string): void {
  const hits = findBannedVocabHits(text);
  if (hits.length > 0) {
    const summary = hits.map((hit) => hit.pattern).join(", ");
    throw new Error(`Banned vocabulary detected in ${where}: ${summary}`);
  }
}
