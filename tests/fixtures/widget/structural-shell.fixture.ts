import type { WidgetShellSlotId } from "../../../apps/widget/src/shell";

export const TEST_ONLY_WIDGET_STRUCTURAL_SLOT_FIXTURE = Object.freeze({
  fixtureScope: "tests/fixtures/widget only",
  expectedSlotIds: [
    "hero-bubble",
    "quick-chip-area",
    "avatar",
    "spotlight",
    "popover"
  ] satisfies readonly WidgetShellSlotId[]
});
