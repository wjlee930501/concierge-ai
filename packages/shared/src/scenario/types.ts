export type ScenarioAvatarPoint = "up" | "left" | "right";

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
  readonly type: "text" | "email" | "tel" | "textarea";
  readonly required: boolean;
  readonly placeholder?: string;
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
  readonly steps: readonly ScenarioStep[];
  readonly leadForm: ScenarioLeadForm;
};

export type ScenarioStepLookup = {
  readonly byId: ReadonlyMap<string, ScenarioStep>;
  readonly all: readonly ScenarioStep[];
};
