import { useId, useRef, type FormEvent, type JSX } from "react";

export type FreeInputBarProps = {
  readonly disabled: boolean;
  readonly placeholder: string;
  readonly draft: string;
  readonly onChangeDraft: (value: string) => void;
  readonly onSubmit: () => void;
};

export function FreeInputBar(props: FreeInputBarProps): JSX.Element {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (props.disabled) return;
    if (props.draft.trim().length === 0) return;
    props.onSubmit();
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1.5 shadow-[0_6px_18px_rgba(7,20,39,0.12)]"
      aria-label="Concierge AI 자유 입력"
    >
      <label htmlFor={id} className="sr-only">
        직접 물어보기
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={props.draft}
        placeholder={props.placeholder}
        onChange={(event) => props.onChangeDraft(event.currentTarget.value)}
        disabled={props.disabled}
        className="flex-1 bg-transparent px-2 text-[13px] text-ink placeholder:text-mist focus:outline-none disabled:text-mist"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={props.disabled || props.draft.trim().length === 0}
        className="rounded-full bg-ink px-3.5 py-1 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-mist/60"
      >
        보내기
      </button>
    </form>
  );
}
