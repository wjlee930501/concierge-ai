import type { JSX } from "react";
import { motion } from "framer-motion";

export type AiSpeechBubbleProps = {
  readonly text: string;
  readonly isStreaming: boolean;
  readonly suggestionLabel?: string;
  readonly onAcceptSuggestion?: () => void;
  readonly onDismiss?: () => void;
};

export function AiSpeechBubble(props: AiSpeechBubbleProps): JSX.Element {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-white/10 bg-ink/95 px-4 py-3 text-[13px] leading-snug text-white/90 shadow-[0_18px_40px_rgba(7,20,39,0.35)] backdrop-blur"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-mint">
        Concierge AI
        {props.isStreaming ? <TypingDots /> : null}
      </div>
      <p className="whitespace-pre-wrap">{props.text}</p>
      {!props.isStreaming &&
      (props.suggestionLabel !== undefined || props.onDismiss !== undefined) ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {props.suggestionLabel !== undefined &&
          props.onAcceptSuggestion !== undefined ? (
            <button
              type="button"
              onClick={props.onAcceptSuggestion}
              className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-ink"
            >
              {props.suggestionLabel}
            </button>
          ) : null}
          {props.onDismiss !== undefined ? (
            <button
              type="button"
              onClick={props.onDismiss}
              className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold text-white/70 hover:text-white"
            >
              계속 입력하기
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}

function TypingDots(): JSX.Element {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-mint"
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </span>
  );
}
