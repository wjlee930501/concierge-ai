// PRD v1.2 §6.1 — banned-vocab 가드 폐기.
//
// v1.1까지 본 모듈은 clinic / hospital / patient / 병원 / 환자 / 진료 / 의료 등
// 의료 도메인 어휘를 차단했다. v1.2에서 이 차단이 폐기됐다. 이유: 이 어휘들은
// 모션랩스의 정상 비즈니스 도메인이며, 큐레이션 시나리오 작성에 필수다.
//
// 보안은 PIPA + prompt injection 두 축으로 재정의됐고 (PRD v1.2 §6.2~§6.3),
// 그 구현은 `@conciergeai/shared`의 `security/` 모듈로 이전됐다:
// - injection-patterns.ts (Layer 1)
// - system-prompt-seal.ts (Layer 2)
// - output-sanitizer.ts   (Layer 3)
//
// 본 파일은 backward-compat을 위해 빈 export만 남긴다. 다음 cleanup PR에서
// 완전 삭제 예정.

export const BANNED_VOCAB_PATTERNS: readonly RegExp[] = [];

export type BannedVocabHit = {
  readonly pattern: string;
  readonly index: number;
};

/** @deprecated PRD v1.2 §6.1 — 본 함수는 항상 빈 결과를 반환한다. */
export function findBannedVocabHits(_text: string): readonly BannedVocabHit[] {
  return [];
}

/** @deprecated PRD v1.2 §6.1 — 본 함수는 no-op이다. */
export function assertNoBannedVocab(_text: string, _where: string): void {
  /* no-op */
}
