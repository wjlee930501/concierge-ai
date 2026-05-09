export type ScenarioAvatarPoint = "up" | "left" | "right";

export type ScenarioBeatAction =
  | {
      readonly type: "scroll_to";
      readonly selector: string;
    }
  | {
      readonly type: "highlight";
      readonly selector: string;
      readonly durationMs?: number;
    }
  | {
      readonly type: "move";
      readonly anchor:
        | "hero_center"
        | "right_anchor"
        | "left_anchor"
        | "right_section_top"
        | "right_section_bottom"
        | "bottom_right"
        | "top_center";
      readonly tilt?: number;
    }
  | {
      readonly type: "expression_change";
      readonly expression:
        | "neutral"
        | "smile"
        | "surprise"
        | "thinking"
        | "celebrate"
        | "concerned"
        | "listening"
        | "farewell";
    }
  | {
      readonly type: "wait";
      readonly durationMs: number;
    };

export type ScenarioBeat = {
  readonly id: string;
  readonly durationMs?: number;
  readonly action: ScenarioBeatAction;
  readonly bubbleMessage?: {
    readonly text: string;
    readonly typewriterSpeedMs?: number;
    readonly pauseAfterMs?: number;
  };
};

export type ScenarioSection = {
  readonly id: string;
  readonly title: string;
  readonly stepId: string;
  readonly beats: readonly ScenarioBeat[];
  readonly userChoiceAtEnd?: boolean;
  readonly defaultNextSectionId?: string;
};

export type ScenarioChapter = {
  readonly id: string;
  readonly title: string;
  readonly transitionHint?: string;
  readonly sections: readonly ScenarioSection[];
};

export type ScenarioChoice = {
  readonly id: string;
  readonly label: string;
  readonly nextStepId: string | null;
};

export type ScenarioPopover = {
  readonly label: string;
  readonly title: string;
  readonly body: string;
};

export type ScenarioStep = {
  readonly id: string;
  readonly popover: ScenarioPopover;
  readonly spotlightTarget: string;
  readonly avatarPoint: ScenarioAvatarPoint;
  readonly choices: readonly ScenarioChoice[];
  readonly isClosing: boolean;
};

export type ScenarioQuickChip = {
  readonly id: string;
  readonly label: string;
  readonly nextStepId: string;
};

export type ScenarioHeroBubble = {
  readonly message: string;
  readonly quickChips: readonly ScenarioQuickChip[];
};

export type ScenarioLeadFormField = {
  readonly id: string;
  readonly label: string;
  readonly type: "text" | "email" | "tel" | "textarea" | "select";
  readonly required: boolean;
  readonly placeholder?: string;
  readonly options?: readonly {
    readonly value: string;
    readonly label: string;
  }[];
};

export type ScenarioPipaConsent = {
  readonly id: "required" | "marketing" | "expanded";
  readonly label: string;
  readonly required: boolean;
};

export type ScenarioLeadForm = {
  readonly title: string;
  readonly subtitle: string;
  readonly fields: readonly ScenarioLeadFormField[];
  readonly pipaConsents: readonly ScenarioPipaConsent[];
  readonly retentionDescription: string;
  readonly submitLabel: string;
  readonly thanksMessage: string;
};

export type Scenario = {
  readonly id: string;
  readonly version: string;
  readonly isPlaceholder: boolean;
  readonly placeholderNotice?: string;
  readonly heroBubble: ScenarioHeroBubble;
  readonly chapters?: readonly ScenarioChapter[];
  readonly steps: readonly ScenarioStep[];
  readonly leadForm: ScenarioLeadForm;
};

export type ScenarioStepLookup = {
  readonly byId: ReadonlyMap<string, ScenarioStep>;
  readonly all: readonly ScenarioStep[];
};
