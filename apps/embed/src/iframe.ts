import { type EmbedIframePolicy } from "./sandbox";

export const EMBED_IFRAME_TITLE = "Concierge AI" as const;

export type IframeSkeletonAttributes = {
  readonly sandbox: string;
  readonly title: string;
  readonly src: string;
  readonly referrerPolicy: string;
  readonly loading: string;
  readonly allow: string;
};

export type IframeSkeletonInput = {
  readonly src: string;
  readonly iframePolicy: EmbedIframePolicy;
  readonly title?: string;
};

export function buildIframeSkeletonAttributes(
  input: IframeSkeletonInput
): IframeSkeletonAttributes {
  const src = input.src.trim();

  if (src.length === 0) {
    throw new Error("iframe src must not be empty");
  }

  assertSafeSrc(src);

  return Object.freeze({
    sandbox: input.iframePolicy.sandbox,
    title: input.title ?? EMBED_IFRAME_TITLE,
    src,
    referrerPolicy: "no-referrer",
    loading: "lazy",
    allow: ""
  });
}

export function createIframeDomSkeleton(
  input: IframeSkeletonInput,
  doc: { createElement(tag: "iframe"): HTMLIFrameElement }
): HTMLIFrameElement {
  const attrs = buildIframeSkeletonAttributes(input);
  const iframe = doc.createElement("iframe");

  iframe.setAttribute("sandbox", attrs.sandbox);
  iframe.setAttribute("title", attrs.title);
  iframe.setAttribute("src", attrs.src);
  iframe.setAttribute("referrerpolicy", attrs.referrerPolicy);
  iframe.setAttribute("loading", attrs.loading);

  if (attrs.allow.length > 0) {
    iframe.setAttribute("allow", attrs.allow);
  }

  iframe.style.border = "none";

  return iframe;
}

const FORBIDDEN_IFRAME_SRC_PROTOCOLS: readonly string[] = [
  "javascript:",
  "data:",
  "blob:",
  "vbscript:",
  "file:"
];

export function assertSafeSrc(src: string): void {
  const normalized = src.trim().toLowerCase();
  for (const proto of FORBIDDEN_IFRAME_SRC_PROTOCOLS) {
    if (normalized.startsWith(proto)) {
      throw new Error(`${proto} src is forbidden`);
    }
  }
}
