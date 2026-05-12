import type { JSX } from "react";

// Small visual primitives shared across HostPagePreview sections.
// Extracted unchanged from the original HostPagePreview monolith so DOM and
// classNames are bit-for-bit identical.

export function Dot({ color }: { readonly color: string }): JSX.Element {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

export function SectionEyebrow(props: {
  readonly label: string;
  readonly tone?: "light" | "dark";
}): JSX.Element {
  const tone = props.tone ?? "light";
  const cls =
    tone === "dark"
      ? "inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-mint"
      : "inline-flex rounded-full border border-accent/20 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent";
  return <div className={cls}>{props.label}</div>;
}

export function CheckMark(): JSX.Element {
  return (
    <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-mint/20 text-center text-[10px] font-black leading-4 text-emerald-700">
      ✓
    </span>
  );
}

export function Badge(props: { readonly label: string }): JSX.Element {
  return (
    <div className="flex aspect-square items-center justify-center rounded-2xl border border-black/5 bg-white text-center text-[12px] font-extrabold text-ink shadow-[0_10px_24px_rgba(7,20,39,0.06)]">
      {props.label}
    </div>
  );
}
