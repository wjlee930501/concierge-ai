import {
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type JSX,
  type PointerEvent
} from "react";

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
  const lastSubmitAtRef = useRef(0);

  const canSubmit = !props.disabled && props.draft.trim().length > 0;

  const submitDraft = (): void => {
    if (!canSubmit) return;
    const now = Date.now();
    if (now - lastSubmitAtRef.current < 200) return;
    lastSubmitAtRef.current = now;
    props.onSubmit();
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitDraft();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submitDraft();
  };

  const handleSubmitPointerUp = (
    event: PointerEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();
    submitDraft();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[42px] items-center gap-2 rounded-full border border-ink/10 bg-white px-2 py-1.5 shadow-[0_5px_14px_rgba(7,20,39,0.08)]"
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
        onKeyDown={handleInputKeyDown}
        disabled={props.disabled}
        className="flex-1 bg-transparent px-2 text-[13px] font-medium text-ink placeholder:text-mist focus:outline-none disabled:text-mist"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        onPointerUp={handleSubmitPointerUp}
        onClick={submitDraft}
        className="min-h-[30px] rounded-full bg-accent px-4 py-1 text-[11px] font-extrabold text-white shadow-[0_4px_12px_rgba(28,115,232,0.16)] disabled:cursor-not-allowed disabled:bg-mist/40 disabled:shadow-none"
      >
        보내기
      </button>
    </form>
  );
}
