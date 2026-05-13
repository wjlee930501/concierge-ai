/**
 * Dev-mode detection — gated through Vite's `import.meta.env.DEV` plus a safe
 * fallback for non-Vite test runners (vitest sets `NODE_ENV=test`, which we
 * also treat as dev). Production bundles must always evaluate this to `false`
 * so dev-only escape hatches (replay-guard bypass, mock-submit `console.info`)
 * stay disabled.
 *
 * The `process` reference is read through `globalThis` so the widget tsconfig
 * (which does not pull in `@types/node`) still type-checks; the runtime guard
 * ensures we never throw in pure-browser bundles.
 */
export function isDevBuild(): boolean {
  try {
    const meta = import.meta as ImportMeta & {
      readonly env?: { readonly DEV?: unknown };
    };
    if (meta.env && meta.env.DEV === true) return true;
  } catch {
    // import.meta.env access can throw in some non-Vite runtimes — ignore.
  }
  const proc = (
    globalThis as {
      readonly process?: { readonly env?: Record<string, string | undefined> };
    }
  ).process;
  if (proc !== undefined && proc.env !== undefined) {
    const env = proc.env.NODE_ENV;
    if (env === "development" || env === "test") return true;
  }
  return false;
}
