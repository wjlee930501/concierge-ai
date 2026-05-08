import type {
  CostLedgerEntry,
  RunningTotalWeek
} from "../../../packages/shared/src/pr-evidence";

type ValidCostLedgerExample = {
  readonly label: string;
  readonly entry: CostLedgerEntry;
};

type InvalidCostLedgerExample = {
  readonly label: string;
  readonly reason: string;
  readonly entry: unknown;
};

const zeroRunningTotal: RunningTotalWeek = Object.freeze({
  week_id: "W1",
  computer_use_minutes: 0,
  claude_review_tokens_estimate: 0,
  llm_calls_estimate: 0
});

const midWeekRunningTotal: RunningTotalWeek = Object.freeze({
  week_id: "W1",
  computer_use_minutes: 4.25,
  claude_review_tokens_estimate: 9000,
  llm_calls_estimate: 12
});

const crossWeekRunningTotal: RunningTotalWeek = Object.freeze({
  week_id: "W2",
  computer_use_minutes: 0,
  claude_review_tokens_estimate: 0,
  llm_calls_estimate: 0
});

const validExamples: readonly ValidCostLedgerExample[] = Object.freeze([
  Object.freeze({
    label: "scaffolding-only first PR with zero running total",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "scaffolding-only PR before number is assigned",
    entry: Object.freeze({
      pr_number: null,
      computer_use_minutes: 0.5,
      claude_review_tokens_estimate: 1500,
      llm_calls_estimate: 0,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "mid-week scaffolding PR contributing to running total",
    entry: Object.freeze({
      pr_number: 7,
      computer_use_minutes: 1.75,
      claude_review_tokens_estimate: 3200,
      llm_calls_estimate: 5,
      running_total_week: midWeekRunningTotal
    })
  }),
  Object.freeze({
    label: "first PR of a later week resets the running total",
    entry: Object.freeze({
      pr_number: 21,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: crossWeekRunningTotal
    })
  })
]);

const invalidExamples: readonly InvalidCostLedgerExample[] = Object.freeze([
  Object.freeze({
    label: "extra key beyond the declared five fields",
    reason: "PR template should not introduce ad-hoc fields without schema PR",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: zeroRunningTotal,
      commentary: "extra"
    })
  }),
  Object.freeze({
    label: "pr_number set to 0",
    reason: "pr_number must be a positive integer or null",
    entry: Object.freeze({
      pr_number: 0,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "negative computer_use_minutes",
    reason: "computer_use_minutes must be a non-negative finite number",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: -0.25,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "non-integer claude_review_tokens_estimate",
    reason: "token estimate must be a non-negative integer",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 1500.5,
      llm_calls_estimate: 0,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "NaN llm_calls_estimate",
    reason: "NaN is not a valid non-negative integer",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: Number.NaN,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "running_total_week with empty week_id",
    reason: "week_id must match /^W[1-9][0-9]*$/",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: Object.freeze({
        week_id: "",
        computer_use_minutes: 0,
        claude_review_tokens_estimate: 0,
        llm_calls_estimate: 0
      })
    })
  }),
  Object.freeze({
    label: "missing llm_calls_estimate key",
    reason: "all five FINAL_ALIGNMENT keys are required, not optional",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "Infinity computer_use_minutes",
    reason: "non-negative finite number must reject Infinity",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: Number.POSITIVE_INFINITY,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: zeroRunningTotal
    })
  }),
  Object.freeze({
    label: "running_total_week with negative llm_calls_estimate",
    reason: "running total subfields must also be non-negative integers",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: Object.freeze({
        week_id: "W1",
        computer_use_minutes: 0,
        claude_review_tokens_estimate: 0,
        llm_calls_estimate: -1
      })
    })
  }),
  Object.freeze({
    label: "running_total_week with malformed week_id 'W0'",
    reason: "week_id must start with W and a digit 1-9",
    entry: Object.freeze({
      pr_number: 1,
      computer_use_minutes: 0,
      claude_review_tokens_estimate: 0,
      llm_calls_estimate: 0,
      running_total_week: Object.freeze({
        week_id: "W0",
        computer_use_minutes: 0,
        claude_review_tokens_estimate: 0,
        llm_calls_estimate: 0
      })
    })
  })
]);

export const TEST_ONLY_COST_LEDGER_FIXTURE = Object.freeze({
  fixtureScope: "tests/fixtures/cost-ledger only",
  validExamples,
  invalidExamples
});
