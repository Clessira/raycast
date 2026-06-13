import * as http from "node:http";

import { buildAuthHeaders } from "./auth";
import { readCapability } from "./capability";
import { mapHttpError, ClessiraError, ClessiraUnreachableError } from "./errors";
import type {
  ActivitySearchItem,
  CurrentActivity,
  LogEntryRequest,
  LogEntryResult,
  StartActivityRequest,
  StartActivityResult,
  Status,
} from "./types";

const REQUEST_TIMEOUT_MS = 4000;
const DEFAULT_SEARCH_LIMIT = 20;

interface RawResponse {
  status: number;
  body: string;
}

interface Envelope<T> {
  ok?: boolean;
  result?: T;
}

interface SearchResponse {
  items?: ActivitySearchItem[];
}

/**
 * Performs a single signed request against the Clessira loopback API over the
 * Unix-domain socket discovered via the capability file. `target` is the full
 * request target (path + query) and is signed verbatim, so it must equal the
 * string sent on the request line.
 */
async function request(
  method: "GET" | "POST",
  target: string,
  body?: unknown,
): Promise<RawResponse> {
  const cap = readCapability();

  const payload =
    body === undefined ? undefined : Buffer.from(JSON.stringify(body), "utf8");
  const auth = buildAuthHeaders(method, target, payload ?? new Uint8Array(), cap.token);

  return new Promise<RawResponse>((resolve, reject) => {
    const req = http.request(
      {
        socketPath: cap.socketPath,
        path: target,
        method,
        headers: {
          "X-Clessira-Token": cap.token,
          "X-Clessira-Timestamp": auth.timestamp,
          "X-Clessira-Nonce": auth.nonce,
          "X-Clessira-Signature": auth.signature,
          ...(payload
            ? {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Length": payload.byteLength,
              }
            : {}),
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        res.on("error", (err) =>
          reject(new ClessiraUnreachableError(err.message, { cause: err })),
        );
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );

    req.on("error", (err) =>
      reject(new ClessiraUnreachableError(err.message, { cause: err })),
    );
    req.on("timeout", () => {
      req.destroy(new ClessiraUnreachableError("Request to Clessira timed out."));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function parseJson<T>(value: string): T | undefined {
  if (!value.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

async function requestJson<T>(
  method: "GET" | "POST",
  target: string,
  body?: unknown,
): Promise<T> {
  const response = await request(method, target, body);
  const parsed = parseJson<unknown>(response.body);

  if (response.status < 200 || response.status >= 300) {
    const serverMessage =
      parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `HTTP ${response.status}`;
    throw mapHttpError(response.status, serverMessage);
  }
  return (parsed ?? {}) as T;
}

function buildSearchTarget(query: string, limit: number): string {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("limit", String(limit));
  return `/activities/search?${params.toString()}`;
}

// MARK: - Public API

export async function healthcheck(): Promise<void> {
  await requestJson("GET", "/healthcheck");
}

export async function searchActivities(
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT,
): Promise<ActivitySearchItem[]> {
  const data = await requestJson<SearchResponse>("GET", buildSearchTarget(query, limit));
  return data.items ?? [];
}

export async function startActivity(
  body: StartActivityRequest,
): Promise<StartActivityResult> {
  if (!body.activityID && !body.name) {
    throw new ClessiraError("startActivity: provide either activityID or name.");
  }
  const data = await requestJson<Envelope<StartActivityResult>>(
    "POST",
    "/activities/start",
    {
      activityID: body.activityID,
      name: body.name,
      createIfMissing: body.createIfMissing ?? false,
    },
  );
  if (!data.result) {
    throw new ClessiraError("startActivity: missing result in response.");
  }
  return data.result;
}

export async function stopTracking(): Promise<void> {
  // Idempotent on the server: stopping while not tracking still returns 200.
  await requestJson("POST", "/activities/stop", {});
}

export async function logEntry(body: LogEntryRequest): Promise<LogEntryResult> {
  if (!body.activityID && !body.name) {
    throw new ClessiraError("logEntry: provide either activityID or name.");
  }
  if (!Number.isInteger(body.durationMinutes) || body.durationMinutes <= 0) {
    throw new ClessiraError("logEntry: durationMinutes must be a positive integer.");
  }
  const data = await requestJson<Envelope<LogEntryResult>>("POST", "/entries", {
    activityID: body.activityID,
    name: body.name,
    durationMinutes: body.durationMinutes,
    note: body.note,
    createIfMissing: body.createIfMissing ?? false,
  });
  if (!data.result) {
    throw new ClessiraError("logEntry: missing result in response.");
  }
  return data.result;
}

export async function getStatus(): Promise<Status> {
  const data = await requestJson<Envelope<Status>>("GET", "/status");
  if (!data.result) {
    throw new ClessiraError("getStatus: missing result in response.");
  }
  return data.result;
}

export async function getCurrent(): Promise<CurrentActivity | null> {
  const data = await requestJson<Envelope<CurrentActivity | null>>("GET", "/current");
  return data.result ?? null;
}
