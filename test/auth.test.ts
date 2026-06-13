import { describe, expect, it } from "vitest";

import { makeNonce, sha256Hex, signRequest, timestampSeconds } from "../src/lib/auth";

// The signing code in `src/lib/auth.ts` is intentionally a byte-for-byte mirror
// of `@clessira/sdk` (js). These vectors are the SAME inputs the SDK, the
// Python reference and the Swift `requestSignature` test helpers use — so a
// matching signature proves cross-client parity, not just self-consistency. If
// one of these breaks, the canonical string or HMAC encoding drifted away from
// the server and every request would 401.
describe("auth — wire parity with @clessira/sdk", () => {
  it("hashes the empty body to the canonical SHA-256", () => {
    expect(sha256Hex(new Uint8Array())).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("signs the reference vector (empty body)", () => {
    const signature = signRequest({
      token: "token",
      method: "POST",
      target: "/test",
      timestamp: "1234567890",
      nonce: "abcdabcdabcdabcd",
      body: new Uint8Array(),
    });
    expect(signature).toBe(
      "2e5984ed312e8f6e18ee9e3a4a6c79fa01d21cc7bcf69a85b7c9d8162639137a",
    );
  });

  it("signs the reference vector with a non-empty body", () => {
    const body = new TextEncoder().encode('{"branch":"main"}');
    const signature = signRequest({
      token: "s3cret",
      method: "POST",
      target: "/branch-changed",
      timestamp: "1700000000",
      nonce: "noncenoncenoncen0",
      body,
    });
    expect(signature).toBe(
      "e0f3c91e3a9dc163ba455fd2cbbf28725fd722931e2eb2274b3d24d7fc07cddb",
    );
  });

  it("uppercases the method in the canonical string", () => {
    const lower = signRequest({
      token: "token",
      method: "post",
      target: "/test",
      timestamp: "1234567890",
      nonce: "abcdabcdabcdabcd",
      body: new Uint8Array(),
    });
    expect(lower).toBe(
      "2e5984ed312e8f6e18ee9e3a4a6c79fa01d21cc7bcf69a85b7c9d8162639137a",
    );
  });

  it("produces a 64-char lowercase hex signature", () => {
    const signature = signRequest({
      token: "t",
      method: "GET",
      target: "/x",
      timestamp: "0",
      nonce: "abcdabcdabcdabcd",
      body: new Uint8Array(),
    });
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it("makeNonce returns 32 lowercase hex chars within the server's 16..128 range", () => {
    expect(makeNonce()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("makeNonce returns unique values", () => {
    expect(makeNonce()).not.toBe(makeNonce());
  });

  it("timestampSeconds floors to whole seconds", () => {
    expect(timestampSeconds(1_700_000_000_999)).toBe("1700000000");
  });
});
