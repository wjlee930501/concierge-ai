// PRD v1.2 §4 + CURATION_CHOREOGRAPHY_SPEC §1~§5 — shared types.

export type AvatarStateName = "idle" | "talking" | "moving" | "pointing";

export type AvatarExpressionName =
  | "neutral"
  | "smile"
  | "surprise"
  | "thinking"
  | "celebrate"
  | "concerned"
  | "listening"
  | "farewell";

export type AnchorName =
  | "hero_center"
  | "right_anchor"
  | "left_anchor"
  | "right_section_top"
  | "right_section_bottom"
  | "bottom_right"
  | "top_center";

export type AnchorPoint = {
  readonly x: number;
  readonly y: number;
};

export type AnchorViewport = {
  readonly width: number;
  readonly height: number;
  readonly isMobile?: boolean;
};

export type ChoreographyTargetRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

export type ChoreographyChoice = {
  readonly label: string;
  readonly next: string;
};

export type ChoreographyBeat = {
  readonly id: string;
  readonly selector?: string;
  readonly anchor?: AnchorName;
  readonly message?: string;
  readonly expression?: AvatarExpressionName;
  readonly duration_ms?: number;
  readonly typewriter_speed_ms?: number;
  readonly pause_after_ms?: number;
  readonly tilt?: "auto" | number;
  readonly highlight?: boolean;
  readonly scroll?: boolean;
};

export type ChoreographyStep = {
  readonly id: string;
  readonly target_selector: string;
  readonly transition_hint?: string;
  readonly preferred_anchor?: AnchorName;
  readonly pointing_tilt?: "auto" | number;
  readonly use_connecting_line?: boolean;
  readonly use_trail?: boolean;
  readonly fallback_message?: string;
  readonly beats?: readonly ChoreographyBeat[];
  readonly popover: {
    readonly message: string;
    readonly choices: readonly ChoreographyChoice[];
  };
};
