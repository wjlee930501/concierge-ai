import { describe, expect, it } from "vitest";
import {
  assertRenderableWidgetShell,
  createWidgetShellViewModel,
  isRenderableWidgetShell,
  reduceWidgetShell,
  WidgetShellRenderGuardError,
  WIDGET_SHELL_LABEL_PREFIX,
  type WidgetShellSlot,
  type WidgetShellSlotId,
  type WidgetShellViewModel
} from "./shell";
import { TEST_ONLY_WIDGET_STRUCTURAL_SLOT_FIXTURE } from "../../../tests/fixtures/widget/structural-shell.fixture";

describe("widget shell scaffold", () => {
  it("keeps structural slots separate from production scenario content", () => {
    const shell = createWidgetShellViewModel();
    const slots = Object.values(shell.slots);

    expect(shell.scope).toBe("week1-scaffold-only");
    expect(slots.map((slot) => slot.id)).toEqual(
      TEST_ONLY_WIDGET_STRUCTURAL_SLOT_FIXTURE.expectedSlotIds
    );
    expect(slots.every((slot) => slot.isScenarioContent === false)).toBe(true);
    expect(slots.every((slot) => slot.ariaLabel.startsWith(WIDGET_SHELL_LABEL_PREFIX))).toBe(true);
  });

  it("settles immediately for reduced-motion step movement", () => {
    const shell = createWidgetShellViewModel({ reducedMotion: true });
    const moved = reduceWidgetShell({
      state: shell,
      event: {
        type: "CLICK_STEP",
        stepId: "test-only-step",
        anchorId: "test-only-anchor"
      }
    });

    expect(moved.reducedMotion).toBe(true);
    expect(moved.choreographer.phase).toBe("settled");
    expect(moved.choreographer.activeStepId).toBe("test-only-step");
  });

  it("keeps non-reduced movement in transition until matching completion", () => {
    const shell = createWidgetShellViewModel({ reducedMotion: false });
    const moved = reduceWidgetShell({
      state: shell,
      event: {
        type: "CLICK_STEP",
        stepId: "test-only-step",
        anchorId: "test-only-anchor"
      }
    });

    expect(moved.choreographer.phase).toBe("transitioning");

    const settled = reduceWidgetShell({
      state: moved,
      event: {
        type: "TRANSITION_DONE",
        transitionId: moved.choreographer.transitionId
      }
    });

    expect(settled.choreographer.phase).toBe("settled");
  });

  it("uses shared choreographer race behavior when reduced motion toggles mid-transition", () => {
    const shell = createWidgetShellViewModel({ reducedMotion: false });
    const transitioning = reduceWidgetShell({
      state: shell,
      event: {
        type: "CLICK_STEP",
        stepId: "test-only-step",
        anchorId: "test-only-anchor"
      }
    });
    const toggled = reduceWidgetShell({
      state: transitioning,
      event: { type: "REDUCED_MOTION_CHANGED", reducedMotion: true }
    });

    expect(toggled.reducedMotion).toBe(true);
    expect(toggled.choreographer.phase).toBe("settled");
    expect(toggled.choreographer.transitionId).toBe(
      transitioning.choreographer.transitionId + 1
    );
  });
});

type MutableSlot = {
  id: WidgetShellSlotId;
  role: WidgetShellSlot["role"];
  ariaLabel: string;
  isScenarioContent: boolean;
};

type MutableShell = {
  scope: string;
  reducedMotion: boolean;
  choreographer: WidgetShellViewModel["choreographer"];
  slots: Record<string, MutableSlot>;
};

function cloneShellForMutation(shell: WidgetShellViewModel): MutableShell {
  const clonedSlots: Record<string, MutableSlot> = {};
  for (const [id, slot] of Object.entries(shell.slots)) {
    clonedSlots[id] = { ...slot };
  }
  return {
    scope: shell.scope,
    reducedMotion: shell.reducedMotion,
    choreographer: shell.choreographer,
    slots: clonedSlots
  };
}

describe("widget shell render guard", () => {
  it("passes for the default scaffold shell", () => {
    const shell = createWidgetShellViewModel();
    expect(() => assertRenderableWidgetShell(shell)).not.toThrow();
    expect(isRenderableWidgetShell(shell)).toBe(true);
  });

  it("rejects a shell with a missing structural slot", () => {
    const shell = createWidgetShellViewModel();
    const mutable = cloneShellForMutation(shell);
    delete mutable.slots["popover"];

    expect(() =>
      assertRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
    ).toThrow(WidgetShellRenderGuardError);
    expect(
      isRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
    ).toBe(false);
  });

  it("rejects a shell with an unexpected extra slot", () => {
    const shell = createWidgetShellViewModel();
    const mutable = cloneShellForMutation(shell);
    mutable.slots["test-only-rogue"] = {
      id: "hero-bubble",
      role: "presentation",
      ariaLabel: `${WIDGET_SHELL_LABEL_PREFIX}: rogue`,
      isScenarioContent: false
    };

    expect(() =>
      assertRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
    ).toThrow(/slots-extra/);
  });

  it("rejects a slot that is marked as scenario content", () => {
    const shell = createWidgetShellViewModel();
    const mutable = cloneShellForMutation(shell);
    mutable.slots["hero-bubble"].isScenarioContent = true;

    expect(() =>
      assertRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
    ).toThrow(/scenario-content/);
  });

  it("rejects an aria label that does not start with the structural prefix", () => {
    const shell = createWidgetShellViewModel();
    const mutable = cloneShellForMutation(shell);
    mutable.slots["avatar"].ariaLabel = "프로덕션 카피처럼 보이는 라벨";

    expect(() =>
      assertRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
    ).toThrow(/aria-label-prefix/);
  });

  it("rejects a non-scaffold scope", () => {
    const shell = createWidgetShellViewModel();
    const mutable = cloneShellForMutation(shell);
    mutable.scope = "production-final";

    expect(() =>
      assertRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
    ).toThrow(/scope/);
  });

  it("does not surface secret-shaped values in error messages", () => {
    const shell = createWidgetShellViewModel();
    const mutable = cloneShellForMutation(shell);
    mutable.slots["hero-bubble"].isScenarioContent = true;

    let thrown: unknown;
    try {
      assertRenderableWidgetShell(mutable as unknown as WidgetShellViewModel);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(WidgetShellRenderGuardError);
    const message = (thrown as Error).message;
    expect(message).not.toMatch(/[A-Za-z0-9_-]{32,}/);
    expect(message).not.toMatch(/sk-|xox[abp]-|AKIA/);
  });

  it("rejects malformed expected slot values without raw runtime errors", () => {
    const malformedValues = [undefined, null, "not-an-object"];

    for (const malformedValue of malformedValues) {
      const shell = createWidgetShellViewModel();
      const mutable = cloneShellForMutation(shell);
      (mutable.slots as Record<string, unknown>)["avatar"] = malformedValue;

      expect(() =>
        assertRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
      ).toThrow(WidgetShellRenderGuardError);
      expect(
        isRenderableWidgetShell(mutable as unknown as WidgetShellViewModel)
      ).toBe(false);
    }
  });

  it("redacts malformed slot ids instead of echoing them", () => {
    const shell = createWidgetShellViewModel();
    const mutable = cloneShellForMutation(shell);
    const secretShapedSlotId = ["sk", "proj", "testonlymarkerwithenoughlength"].join("-");
    mutable.slots[secretShapedSlotId] = {
      id: "hero-bubble",
      role: "presentation",
      ariaLabel: `${WIDGET_SHELL_LABEL_PREFIX}: rogue`,
      isScenarioContent: false
    };
    mutable.slots["avatar"].id = secretShapedSlotId as WidgetShellSlotId;

    const malformedExtraSlotShell = {
      ...mutable,
      slots: {
        ...mutable.slots,
        [secretShapedSlotId]: undefined
      }
    };

    const messages: string[] = [];
    for (const candidate of [mutable, malformedExtraSlotShell]) {
      try {
        assertRenderableWidgetShell(candidate as unknown as WidgetShellViewModel);
      } catch (error) {
        messages.push((error as Error).message);
      }
    }

    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
      expect(message).not.toContain(secretShapedSlotId);
      expect(message).not.toMatch(/sk-proj-[A-Za-z0-9_-]{20,}/);
    }
  });
});

describe("widget shell freeze hardening", () => {
  it("freezes both the slots record and individual slot objects", () => {
    const shell = createWidgetShellViewModel();
    expect(Object.isFrozen(shell)).toBe(true);
    expect(Object.isFrozen(shell.slots)).toBe(true);
    for (const slot of Object.values(shell.slots)) {
      expect(Object.isFrozen(slot)).toBe(true);
    }
  });

  it("rejects mutation attempts on individual slot fields in strict mode", () => {
    const shell = createWidgetShellViewModel();
    const target = shell.slots["hero-bubble"] as WidgetShellSlot & {
      ariaLabel: string;
    };
    expect(() => {
      target.ariaLabel = "tampered";
    }).toThrow(TypeError);
  });

  it("does not introduce final user-facing scenario copy in default labels", () => {
    const shell = createWidgetShellViewModel();
    for (const slot of Object.values(shell.slots)) {
      expect(slot.ariaLabel.startsWith(WIDGET_SHELL_LABEL_PREFIX)).toBe(true);
      expect(slot.isScenarioContent).toBe(false);
    }
    expect(TEST_ONLY_WIDGET_STRUCTURAL_SLOT_FIXTURE.fixtureScope).toBe(
      "tests/fixtures/widget only"
    );
  });
});
