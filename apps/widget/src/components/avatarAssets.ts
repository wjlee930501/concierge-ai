import neutralAvif from "../../assets/avatar/concierge-neutral-256.avif";
import neutralWebp from "../../assets/avatar/concierge-neutral-256.webp";
import smileAvif from "../../assets/avatar/concierge-smile-256.avif";
import smileWebp from "../../assets/avatar/concierge-smile-256.webp";
import surpriseAvif from "../../assets/avatar/concierge-surprise-256.avif";
import surpriseWebp from "../../assets/avatar/concierge-surprise-256.webp";
import thinkingAvif from "../../assets/avatar/concierge-thinking-256.avif";
import thinkingWebp from "../../assets/avatar/concierge-thinking-256.webp";

export type AvatarExpression =
  | "neutral"
  | "smile"
  | "surprise"
  | "thinking"
  | "celebrate"
  | "concerned"
  | "listening"
  | "farewell";

export type AvatarTier1Expression =
  | "neutral"
  | "smile"
  | "surprise"
  | "thinking";

export type AvatarExpressionAsset = {
  readonly id: AvatarTier1Expression;
  readonly avif: string;
  readonly webp: string;
  readonly objectPosition: string;
};

export const TIER1_AVATAR_EXPRESSIONS: readonly AvatarTier1Expression[] = [
  "neutral",
  "smile",
  "surprise",
  "thinking"
];

const TIER1_ASSETS: Readonly<Record<AvatarTier1Expression, AvatarExpressionAsset>> =
  Object.freeze({
    neutral: {
      id: "neutral",
      avif: neutralAvif,
      webp: neutralWebp,
      objectPosition: "center center"
    },
    smile: {
      id: "smile",
      avif: smileAvif,
      webp: smileWebp,
      objectPosition: "center center"
    },
    surprise: {
      id: "surprise",
      avif: surpriseAvif,
      webp: surpriseWebp,
      objectPosition: "center center"
    },
    thinking: {
      id: "thinking",
      avif: thinkingAvif,
      webp: thinkingWebp,
      objectPosition: "center center"
    }
  });

export const AVATAR_EXPRESSION_ASSETS: Readonly<
  Record<AvatarExpression, AvatarExpressionAsset>
> = Object.freeze({
  ...TIER1_ASSETS,
  celebrate: TIER1_ASSETS.smile,
  concerned: TIER1_ASSETS.thinking,
  listening: TIER1_ASSETS.neutral,
  farewell: TIER1_ASSETS.smile
});
