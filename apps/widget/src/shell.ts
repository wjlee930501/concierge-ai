import {
  createChoreographerState,
  reduceChoreographer,
  type ChoreographerEvent,
  type ChoreographerState,
  type ChoreographerViewport
} from "@conciergeai/shared";

export const WIDGET_SHELL_LABEL_PREFIX = "테스트 전용 구조" as const;

export type WidgetShellSlotId =
  | "hero-bubble"
  | "quick-chip-area"
  | "avatar"
  | "spotlight"
  | "popover";

export type WidgetShellSlot = {
  readonly id: WidgetShellSlotId;
  readonly role: "container" | "region" | "presentation";
  readonly ariaLabel: string;
  readonly isScenarioContent: false;
};

export type WidgetShellViewModel = {
  readonly scope: "week1-scaffold-only";
  readonly reducedMotion: boolean;
  readonly choreographer: ChoreographerState;
  readonly slots: Record<WidgetShellSlotId, WidgetShellSlot>;
};

export type WidgetShellInput = {
  readonly viewport?: ChoreographerViewport;
  readonly reducedMotion?: boolean;
};

export type WidgetShellTransitionInput = {
  readonly state: WidgetShellViewModel;
  readonly event: ChoreographerEvent;
};

export const WIDGET_SHELL_KNOWN_SLOT_IDS = Object.freeze([
  "hero-bubble",
  "quick-chip-area",
  "avatar",
  "spotlight",
  "popover"
] as const) satisfies readonly WidgetShellSlotId[];

const WIDGET_SHELL_SLOTS: Record<WidgetShellSlotId, WidgetShellSlot> = Object.freeze({
  "hero-bubble": Object.freeze({
    id: "hero-bubble",
    role: "container",
    ariaLabel: `${WIDGET_SHELL_LABEL_PREFIX}: 히어로 버블 컨테이너`,
    isScenarioContent: false
  }),
  "quick-chip-area": Object.freeze({
    id: "quick-chip-area",
    role: "region",
    ariaLabel: `${WIDGET_SHELL_LABEL_PREFIX}: 퀵칩 영역`,
    isScenarioContent: false
  }),
  avatar: Object.freeze({
    id: "avatar",
    role: "presentation",
    ariaLabel: `${WIDGET_SHELL_LABEL_PREFIX}: 아바타 슬롯`,
    isScenarioContent: false
  }),
  spotlight: Object.freeze({
    id: "spotlight",
    role: "presentation",
    ariaLabel: `${WIDGET_SHELL_LABEL_PREFIX}: 스포트라이트 슬롯`,
    isScenarioContent: false
  }),
  popover: Object.freeze({
    id: "popover",
    role: "presentation",
    ariaLabel: `${WIDGET_SHELL_LABEL_PREFIX}: 팝오버 슬롯`,
    isScenarioContent: false
  })
}) as Record<WidgetShellSlotId, WidgetShellSlot>;

export function createWidgetShellViewModel(
  input: WidgetShellInput = {}
): WidgetShellViewModel {
  const choreographerInput: {
    viewport?: ChoreographerViewport;
    reducedMotion?: boolean;
  } = {};

  if (input.viewport !== undefined) {
    choreographerInput.viewport = input.viewport;
  }

  if (input.reducedMotion !== undefined) {
    choreographerInput.reducedMotion = input.reducedMotion;
  }

  const choreographer = createChoreographerState(choreographerInput);

  return freezeWidgetShell({
    scope: "week1-scaffold-only",
    reducedMotion: choreographer.reducedMotion,
    choreographer,
    slots: WIDGET_SHELL_SLOTS
  });
}

export function reduceWidgetShell(
  input: WidgetShellTransitionInput
): WidgetShellViewModel {
  const choreographer = reduceChoreographer(
    input.state.choreographer,
    input.event
  );

  return freezeWidgetShell({
    ...input.state,
    reducedMotion: choreographer.reducedMotion,
    choreographer
  });
}

function freezeWidgetShell(state: WidgetShellViewModel): WidgetShellViewModel {
  const frozenSlots = Object.fromEntries(
    Object.entries(state.slots).map(([id, slot]) => [id, Object.freeze({ ...slot })])
  ) as Record<WidgetShellSlotId, WidgetShellSlot>;

  return Object.freeze({
    ...state,
    slots: Object.freeze(frozenSlots)
  });
}

export class WidgetShellRenderGuardError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(`[widget-shell:${code}] ${message}`);
    this.name = "WidgetShellRenderGuardError";
    this.code = code;
  }
}

function isWidgetShellSlotShape(slot: unknown): slot is WidgetShellSlot {
  if (slot === null || typeof slot !== "object") {
    return false;
  }

  const candidate = slot as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "container" ||
      candidate.role === "region" ||
      candidate.role === "presentation") &&
    typeof candidate.ariaLabel === "string" &&
    typeof candidate.isScenarioContent === "boolean"
  );
}

export function assertRenderableWidgetShell(
  shell: WidgetShellViewModel
): void {
  if (shell.scope !== "week1-scaffold-only") {
    throw new WidgetShellRenderGuardError(
      "scope",
      `scope must be "week1-scaffold-only" for scaffold render`
    );
  }

  const slotIds = Object.keys(shell.slots) as WidgetShellSlotId[];
  const expected = WIDGET_SHELL_KNOWN_SLOT_IDS;

  const missing = expected.filter((id) => !(id in shell.slots));
  if (missing.length > 0) {
    throw new WidgetShellRenderGuardError(
      "slots-missing",
      `missing structural slot ids: ${missing.join(", ")}`
    );
  }

  const extra = slotIds.filter(
    (id) => !(expected as readonly string[]).includes(id)
  );
  if (extra.length > 0) {
    throw new WidgetShellRenderGuardError(
      "slots-extra",
      `unexpected structural slot id count: ${extra.length}`
    );
  }

  for (const id of expected) {
    const slot = shell.slots[id];
    if (!isWidgetShellSlotShape(slot)) {
      throw new WidgetShellRenderGuardError(
        "slot-shape",
        `slot record key "${id}" must be a structural slot object`
      );
    }
    if (slot.id !== id) {
      throw new WidgetShellRenderGuardError(
        "slot-id-mismatch",
        `slot record key "${id}" does not match its structural slot id`
      );
    }
    if (slot.isScenarioContent !== false) {
      throw new WidgetShellRenderGuardError(
        "scenario-content",
        `slot "${id}" must have isScenarioContent === false in scaffold scope`
      );
    }
    if (!slot.ariaLabel.startsWith(WIDGET_SHELL_LABEL_PREFIX)) {
      throw new WidgetShellRenderGuardError(
        "aria-label-prefix",
        `slot "${id}" ariaLabel must start with structural label prefix`
      );
    }
  }
}

export function isRenderableWidgetShell(
  shell: WidgetShellViewModel
): boolean {
  try {
    assertRenderableWidgetShell(shell);
    return true;
  } catch (error) {
    if (error instanceof WidgetShellRenderGuardError) {
      return false;
    }
    throw error;
  }
}
