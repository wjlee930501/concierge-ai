import { describe, expect, it } from "vitest";
import { createEmbedIframePolicy } from "./sandbox";
import {
  EMBED_IFRAME_TITLE,
  buildIframeSkeletonAttributes,
  createIframeDomSkeleton,
  type IframeSkeletonAttributes
} from "./iframe";

describe("iframe skeleton", () => {
  const defaultPolicy = createEmbedIframePolicy();

  describe("buildIframeSkeletonAttributes", () => {
    it("produces safe default attributes from embed iframe policy", () => {
      const attrs = buildIframeSkeletonAttributes({
        src: "https://widget.example.test/v1",
        iframePolicy: defaultPolicy
      });

      expect(attrs.sandbox).toBe("allow-scripts");
      expect(attrs.title).toBe(EMBED_IFRAME_TITLE);
      expect(attrs.src).toBe("https://widget.example.test/v1");
      expect(attrs.referrerPolicy).toBe("no-referrer");
      expect(attrs.loading).toBe("lazy");
      expect(attrs.allow).toBe("");
    });

    it("accepts a custom title", () => {
      const attrs = buildIframeSkeletonAttributes({
        src: "https://widget.example.test/v1",
        iframePolicy: defaultPolicy,
        title: "test-custom-title"
      });

      expect(attrs.title).toBe("test-custom-title");
    });

    it("rejects empty src", () => {
      expect(() =>
        buildIframeSkeletonAttributes({
          src: "",
          iframePolicy: defaultPolicy
        })
      ).toThrow(/empty/u);
    });

    it("rejects javascript: src", () => {
      expect(() =>
        buildIframeSkeletonAttributes({
          src: "javascript:alert(1)",
          iframePolicy: defaultPolicy
        })
      ).toThrow(/javascript/u);
    });

    it("rejects data: src", () => {
      expect(() =>
        buildIframeSkeletonAttributes({
          src: "data:text/html,<h1>xss</h1>",
          iframePolicy: defaultPolicy
        })
      ).toThrow(/data/u);
    });

    it("returns a frozen object", () => {
      const attrs = buildIframeSkeletonAttributes({
        src: "https://widget.example.test/v1",
        iframePolicy: defaultPolicy
      });

      expect(Object.isFrozen(attrs)).toBe(true);
    });

    it("applies sandbox from the provided iframe policy", () => {
      const policy = createEmbedIframePolicy({
        sandboxTokens: ["allow-scripts", "allow-forms"]
      });
      const attrs = buildIframeSkeletonAttributes({
        src: "https://widget.example.test/v1",
        iframePolicy: policy
      });

      expect(attrs.sandbox).toBe("allow-scripts allow-forms");
    });
  });

  describe("createIframeDomSkeleton", () => {
    function createMockDocument() {
      const attributes = new Map<string, string>();
      const styles: Record<string, string> = {};
      const mockIframe = {
        setAttribute(name: string, value: string) {
          attributes.set(name, value);
        },
        getAttribute(name: string) {
          return attributes.get(name) ?? null;
        },
        style: styles
      } as unknown as HTMLIFrameElement;

      return {
        createElement(_tag: "iframe") {
          return mockIframe;
        },
        mockIframe,
        attributes,
        styles
      };
    }

    it("sets all safe attributes on the iframe element", () => {
      const mockDoc = createMockDocument();
      const iframe = createIframeDomSkeleton(
        {
          src: "https://widget.example.test/v1",
          iframePolicy: defaultPolicy
        },
        mockDoc
      );

      expect(iframe).toBe(mockDoc.mockIframe);
      expect(mockDoc.attributes.get("sandbox")).toBe("allow-scripts");
      expect(mockDoc.attributes.get("title")).toBe(EMBED_IFRAME_TITLE);
      expect(mockDoc.attributes.get("src")).toBe(
        "https://widget.example.test/v1"
      );
      expect(mockDoc.attributes.get("referrerpolicy")).toBe("no-referrer");
      expect(mockDoc.attributes.get("loading")).toBe("lazy");
      expect(mockDoc.attributes.has("allow")).toBe(false);
    });

    it("sets border none style", () => {
      const mockDoc = createMockDocument();
      createIframeDomSkeleton(
        {
          src: "https://widget.example.test/v1",
          iframePolicy: defaultPolicy
        },
        mockDoc
      );

      expect(mockDoc.styles["border"]).toBe("none");
    });
  });
});
