import type { JSX } from "react";

export function PlaceholderBanner(): JSX.Element {
  return (
    <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs leading-snug text-yellow-800">
      <strong className="font-bold">[PLACEHOLDER]</strong> 본 페이지는 source
      data 도착 전까지 read-only stub 입니다 — FINAL_ALIGNMENT §3. 실제 RBAC,
      CRUD, 감사 로그 연결은 Phase 5에서 구현됩니다.
    </div>
  );
}
