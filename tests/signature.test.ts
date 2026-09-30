import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "../src/lib/signature.js";

describe("verifyMetaSignature", () => {
  const body = JSON.stringify({ object: "page" });
  const secret = "test-secret";
  const valid = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  it("accepts a valid signature", () => {
    expect(verifyMetaSignature(body, valid, secret)).toBe(true);
  });

  it("rejects missing, malformed, and invalid signatures", () => {
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
    expect(verifyMetaSignature(body, "sha1=bad", secret)).toBe(false);
    expect(verifyMetaSignature(body, `${valid.slice(0, -1)}0`, secret)).toBe(false);
  });
});
