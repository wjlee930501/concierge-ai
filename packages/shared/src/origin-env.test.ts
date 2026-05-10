import { describe, expect, it } from "vitest";
import { OriginPolicyError } from "./origin";
import {
  CONCIERGE_ALLOWED_ORIGINS_ENV_KEY,
  parseOriginAllowlistFromEnv,
  validateOriginsForEnvironment,
  type OriginEnvironment
} from "./origin-env";

describe("origin env contract", () => {
  describe("parseOriginAllowlistFromEnv", () => {
    it("reads the canonical env key and parses comma/space separated origins", () => {
      const env = {
        [CONCIERGE_ALLOWED_ORIGINS_ENV_KEY]:
          "https://staging.example.test, http://localhost:5173"
      };

      expect(parseOriginAllowlistFromEnv(env)).toEqual([
        "https://staging.example.test",
        "http://localhost:5173"
      ]);
    });

    it("returns empty array when the env key is missing", () => {
      expect(parseOriginAllowlistFromEnv({})).toEqual([]);
    });

    it("returns empty array when the env key is blank", () => {
      expect(
        parseOriginAllowlistFromEnv({
          [CONCIERGE_ALLOWED_ORIGINS_ENV_KEY]: "   "
        })
      ).toEqual([]);
    });

    it("rejects wildcard in the env value", () => {
      expect(() =>
        parseOriginAllowlistFromEnv({
          [CONCIERGE_ALLOWED_ORIGINS_ENV_KEY]: "*"
        })
      ).toThrow(OriginPolicyError);
    });
  });

  describe("validateOriginsForEnvironment", () => {
    const localEnvs: OriginEnvironment[] = ["development", "test"];
    const remoteEnvs: OriginEnvironment[] = [
      "staging",
      "preview",
      "production"
    ];

    it.each(localEnvs)("%s allows localhost origins", (env) => {
      expect(
        validateOriginsForEnvironment(
          ["http://localhost:5173", "http://127.0.0.1:3000"],
          env
        )
      ).toEqual(["http://localhost:5173", "http://127.0.0.1:3000"]);
    });

    it.each(localEnvs)("%s allows .test TLD origins", (env) => {
      expect(
        validateOriginsForEnvironment(["https://host.example.test"], env)
      ).toEqual(["https://host.example.test"]);
    });

    it.each(localEnvs)("%s rejects non-localhost non-.test origins", (env) => {
      expect(() =>
        validateOriginsForEnvironment(
          ["https://real-hospital.example.com"],
          env
        )
      ).toThrow(OriginPolicyError);
    });

    it.each(remoteEnvs)("%s requires https origins", (env) => {
      expect(
        validateOriginsForEnvironment(["https://staging.example.test"], env)
      ).toEqual(["https://staging.example.test"]);
    });

    it.each(remoteEnvs)("%s rejects http origins", (env) => {
      expect(() =>
        validateOriginsForEnvironment(["http://staging.example.test"], env)
      ).toThrow(OriginPolicyError);
    });

    it("validates all origins in the list", () => {
      expect(() =>
        validateOriginsForEnvironment(
          ["https://ok.example.test", "http://not-ok.example.test"],
          "production"
        )
      ).toThrow(OriginPolicyError);
    });

    it("returns the origins unchanged on success", () => {
      const origins = ["https://staging.example.test"] as const;

      expect(validateOriginsForEnvironment(origins, "staging")).toBe(origins);
    });
  });
});
