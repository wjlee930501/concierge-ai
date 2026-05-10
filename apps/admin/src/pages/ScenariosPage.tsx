import type { JSX } from "react";
import { PlaceholderBanner } from "../components/PlaceholderBanner";

export function ScenariosPage(): JSX.Element {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-black tracking-tight">시나리오</h1>
      <PlaceholderBanner />
      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <p className="text-sm text-ink">
          시나리오 JSON 편집은 source data 도착 후 admin/CRUD route + 감사
          로그와 연결됩니다. 현재는{" "}
          <code className="rounded bg-bg px-1">
            tests/fixtures/scenarios/placeholder_v0.json
          </code>
          이 test-only fixture로만 사용됩니다.
        </p>
      </div>
    </section>
  );
}
