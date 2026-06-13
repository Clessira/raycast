import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * HMAC request signing for the Clessira loopback API. Kept byte-for-byte
 * compatible with the Mac app (`BranchChangeServer.requestSignature`), the VS
 * Code extension, and the JS/Python SDKs — the canonical string is
 * `method\ntarget\ntimestamp\nnonce\nsha256(body)` signed with HMAC-SHA256
 * keyed by the shared token, hex-encoded lowercase.
 */
export interface SignRequestParams {
  token: string;
  method: string;
  /** Request target including the query string, e.g. `/activities/search?q=x&limit=20`. */
  target: string;
  timestamp: string;
  nonce: string;
  body: Uint8Array;
}

export interface AuthHeaders {
  timestamp: string;
  nonce: string;
  signature: string;
}

/** 32 lowercase hex chars — alphanumeric, within the server's 16..128 range. */
export function makeNonce(): string {
  return randomBytes(16).toString("hex");
}

export function timestampSeconds(nowMs: number = Date.now()): string {
  return Math.floor(nowMs / 1000).toString();
}

export function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function signRequest(params: SignRequestParams): string {
  const { token, method, target, timestamp, nonce, body } = params;
  const bodyHash = sha256Hex(body);
  const canonical = [method.toUpperCase(), target, timestamp, nonce, bodyHash].join("\n");
  return createHmac("sha256", token).update(canonical).digest("hex");
}

export function buildAuthHeaders(
  method: string,
  target: string,
  body: Uint8Array,
  token: string,
): AuthHeaders {
  const timestamp = timestampSeconds();
  const nonce = makeNonce();
  return {
    timestamp,
    nonce,
    signature: signRequest({ token, method, target, timestamp, nonce, body }),
  };
}
