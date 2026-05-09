// Workspace boundary marker. The actual widget renders via main.tsx, which is
// the Vite entry. This file exists only so the @conciergeai/widget workspace
// has a `.exports['.']` target that compiles in plain TypeScript (no JSX).

export const WIDGET_PACKAGE_BOUNDARY = "@conciergeai/widget" as const;
