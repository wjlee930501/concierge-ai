import type {
  AiToolCall,
  AiToolName
} from "./tools";
import {
  aiToolCallSchema,
  aiToolSchemas
} from "./tools";
import {
  buildPlaceholderSafetyResponse,
  type SafetyResponseReason
} from "./safety";

export type AiProviderRequest = {
  readonly systemPrompt: string;
  readonly systemPromptSeal: string;
  readonly userMessage: string;
  readonly enabledTools: readonly AiToolName[];
  readonly promptCache: boolean;
};

export type AiProviderResponse = {
  readonly toolCall: AiToolCall;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheHit: boolean;
};

export interface AiProvider {
  readonly id: string;
  generate(request: AiProviderRequest): Promise<AiProviderResponse>;
}

export type MockProviderHandler = (
  request: AiProviderRequest
) => AiToolCall | { readonly safety: SafetyResponseReason };

const DEFAULT_NONCE_PREFIX = "mock-nonce-";

export function createMockAiProvider(options?: {
  readonly id?: string;
  readonly handler?: MockProviderHandler;
}): AiProvider {
  const id = options?.id ?? "mock-provider";
  const handler =
    options?.handler ??
    (() => ({
      tool: "noop",
      input: { note: "[PLACEHOLDER] mock provider default no-op response" },
      nonce: `${DEFAULT_NONCE_PREFIX}${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now()
    }));

  return {
    id,
    async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
      const result = handler(request);
      const toolCall = "safety" in result
        ? buildSafetyToolCall(result.safety)
        : result;
      const validated = aiToolCallSchema.parse(toolCall);
      enforceEnabledTool(validated.tool as AiToolName, request.enabledTools);
      return {
        toolCall: validated as AiToolCall,
        inputTokens: estimateTokens(request.systemPrompt) +
          estimateTokens(request.userMessage),
        outputTokens: 64,
        cacheHit: request.promptCache
      };
    }
  };
}

function buildSafetyToolCall(reason: SafetyResponseReason): AiToolCall {
  const payload = buildPlaceholderSafetyResponse(reason);
  const schema = aiToolSchemas.safety_response;
  schema.parse(payload);
  return {
    tool: "safety_response",
    input: payload,
    nonce: `${DEFAULT_NONCE_PREFIX}safety-${reason}`,
    timestamp: Date.now()
  };
}

function enforceEnabledTool(
  tool: AiToolName,
  enabled: readonly AiToolName[]
): void {
  if (!enabled.includes(tool)) {
    throw new Error(
      `Concierge AI provider attempted to use disabled tool "${tool}"`
    );
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
