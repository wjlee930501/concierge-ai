import type { JSX } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ScenarioLeadForm } from "@conciergeai/shared";

export type LeadFormCardProps = {
  readonly form: ScenarioLeadForm;
  readonly fields: Readonly<Record<string, string>>;
  readonly consents: Readonly<
    Record<"required" | "marketing" | "expanded", boolean>
  >;
  readonly canSubmit: boolean;
  readonly onChangeField: (fieldId: string, value: string) => void;
  readonly onToggleConsent: (
    consentId: "required" | "marketing" | "expanded",
    value: boolean
  ) => void;
  readonly onSubmit: () => void;
  readonly placeholderNotice?: string;
  readonly summaryHint?: string;
  readonly errorMessage?: string | null;
  readonly onBack?: () => void;
};

const FIELD_STAGGER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
};

const FIELD_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

const FIELD_LABEL_CLASS =
  "flex items-center gap-1 text-[12px] font-extrabold text-ink";
const FIELD_CONTROL_CLASS =
  "rounded-lg border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium text-ink placeholder:text-mist/75 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function LeadFormCard(props: LeadFormCardProps): JSX.Element {
  const reduced = useReducedMotion() === true;

  return (
    <motion.section
      aria-label="Concierge Lead Form"
      data-concierge-hitbox="true"
      data-polish-field-stagger={reduced ? "off" : "on"}
      className="pointer-events-auto fixed bottom-5 left-1/2 z-[95] max-h-[min(720px,calc(100dvh-40px))] w-[min(440px,calc(100vw-28px))] overflow-y-auto rounded-[28px] border border-ink/10 bg-white/95 p-5 shadow-[0_18px_56px_rgba(7,20,39,0.16)] backdrop-blur"
      initial={
        reduced ? { x: "-50%", opacity: 0 } : { x: "-50%", y: 18, opacity: 0 }
      }
      animate={{ x: "-50%", y: 0, opacity: 1 }}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 210, damping: 28, mass: 0.95 }
      }
    >
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-ink/10 pb-3">
        <div>
          <h2 className="text-base font-black tracking-tight text-ink">
            {props.form.title}
          </h2>
          <p className="mt-1 text-xs leading-snug text-mist">
            {props.form.subtitle}
          </p>
        </div>
        {props.onBack !== undefined ? (
          <button
            type="button"
            className="shrink-0 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[11px] font-extrabold text-mist shadow-[0_3px_10px_rgba(7,20,39,0.04)] hover:border-accent/40 hover:text-ink"
            onClick={props.onBack}
            aria-label="이전 단계로 돌아가기"
          >
            ← 이전
          </button>
        ) : null}
      </header>

      {props.summaryHint !== undefined ? (
        <p className="mb-3 rounded-md bg-mint/10 px-2 py-1 text-[11px] leading-snug text-emerald-700">
          {props.summaryHint}
        </p>
      ) : null}

      {props.placeholderNotice !== undefined ? (
        <p className="mb-3 rounded-md bg-yellow-50 px-2 py-1 text-[11px] leading-snug text-yellow-800">
          {props.placeholderNotice}
        </p>
      ) : null}

      <motion.div
        role="form"
        className="flex flex-col gap-3.5"
        variants={reduced ? undefined : FIELD_STAGGER_VARIANTS}
        initial={reduced ? false : "hidden"}
        animate={reduced ? undefined : "show"}
        onKeyDown={(event) => {
          if (
            event.key !== "Enter" ||
            event.target instanceof HTMLTextAreaElement ||
            !props.canSubmit
          ) {
            return;
          }
          event.preventDefault();
          props.onSubmit();
        }}
      >
        {props.form.fields.map((field) => {
          const value = props.fields[field.id] ?? "";
          const placeholder = field.placeholder;
          if (field.type === "textarea") {
            return (
              <FieldRow key={field.id} reduced={reduced}>
                <label className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL_CLASS}>
                    {field.label}
                    {field.required ? (
                      <span className="text-red-500">*</span>
                    ) : null}
                  </span>
                  <textarea
                    className={`${FIELD_CONTROL_CLASS} min-h-[92px] resize-y`}
                    required={field.required}
                    value={value}
                    {...(placeholder !== undefined ? { placeholder } : {})}
                    onChange={(event) =>
                      props.onChangeField(field.id, event.currentTarget.value)
                    }
                  />
                </label>
              </FieldRow>
            );
          }
          if (field.type === "select") {
            return (
              <FieldRow key={field.id} reduced={reduced}>
                <label className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL_CLASS}>
                    {field.label}
                    {field.required ? (
                      <span className="text-red-500">*</span>
                    ) : null}
                  </span>
                  <select
                    className={FIELD_CONTROL_CLASS}
                    required={field.required}
                    value={value}
                    onChange={(event) =>
                      props.onChangeField(field.id, event.currentTarget.value)
                    }
                  >
                    <option value="">{placeholder ?? "선택해주세요"}</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </FieldRow>
            );
          }
          return (
            <FieldRow key={field.id} reduced={reduced}>
              <label className="flex flex-col gap-1.5">
                <span className={FIELD_LABEL_CLASS}>
                  {field.label}
                  {field.required ? (
                    <span className="text-red-500">*</span>
                  ) : null}
                </span>
                <input
                  type={field.type}
                  className={FIELD_CONTROL_CLASS}
                  required={field.required}
                  value={value}
                  {...(placeholder !== undefined ? { placeholder } : {})}
                  onChange={(event) =>
                    props.onChangeField(field.id, event.currentTarget.value)
                  }
                />
              </label>
            </FieldRow>
          );
        })}

        {props.errorMessage !== undefined && props.errorMessage !== null ? (
          <p className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold leading-snug text-red-700">
            {props.errorMessage}
          </p>
        ) : null}

        <FieldRow reduced={reduced}>
          <fieldset className="flex flex-col gap-2.5 rounded-xl border border-ink/10 bg-bg/70 p-3 text-xs">
            <legend className="px-1 text-[11px] font-black uppercase tracking-wide text-mist">
              PIPA 동의 (필수 / 선택 분리)
            </legend>
            {props.form.pipaConsents.map((consent) => (
              <label
                key={consent.id}
                className="flex items-start gap-2 rounded-lg bg-white/70 px-2 py-1.5 text-ink"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={props.consents[consent.id]}
                  onChange={(event) =>
                    props.onToggleConsent(
                      consent.id,
                      event.currentTarget.checked
                    )
                  }
                />
                <span>
                  {consent.label}
                  {consent.required ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </span>
              </label>
            ))}
            <p className="mt-1 text-[11px] leading-snug text-mist">
              {props.form.retentionDescription}
            </p>
          </fieldset>
        </FieldRow>

        <FieldRow reduced={reduced}>
          <button
            type="button"
            disabled={!props.canSubmit}
            onClick={props.onSubmit}
            className={
              props.canSubmit
                ? "min-h-[44px] w-full rounded-full bg-accent text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(28,115,232,0.18)] hover:bg-accent/90"
                : "min-h-[44px] w-full cursor-not-allowed rounded-full bg-mist/25 text-sm font-extrabold text-mist"
            }
          >
            {props.form.submitLabel}
          </button>
        </FieldRow>
      </motion.div>
    </motion.section>
  );
}

function FieldRow(props: {
  readonly reduced: boolean;
  readonly children: JSX.Element;
}): JSX.Element {
  if (props.reduced) {
    return <div>{props.children}</div>;
  }
  return (
    <motion.div variants={FIELD_ITEM_VARIANTS}>{props.children}</motion.div>
  );
}
