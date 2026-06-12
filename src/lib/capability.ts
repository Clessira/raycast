import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { ClessiraUnreachableError } from "./errors";

/**
 * Discovery file the Clessira Mac app writes alongside its loopback API
 * socket. Lives inside the sandbox container's `Data/` directory. Mirrors the
 * path used by the VS Code extension so both clients stay zero-config.
 */
export interface APICapability {
  version: number;
  socketPath: string;
  token: string;
  pid: number;
}

export function capabilityFilePath(): string {
  return join(
    homedir(),
    "Library/Containers/com.mattes.clessira/Data/api-endpoint.json",
  );
}

/**
 * Reads and validates the capability file. Throws {@link ClessiraUnreachableError}
 * when the file is missing, unreadable, malformed, or carries an unexpected
 * version — callers should treat any such failure as "Clessira is not currently
 * reachable" and prompt the user to open the app / enable the integration.
 */
export function readCapability(
  filePath: string = capabilityFilePath(),
): APICapability {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    throw new ClessiraUnreachableError(
      "Clessira is not reachable. Open the Clessira app and enable the loopback API integration.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ClessiraUnreachableError("Capability file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new ClessiraUnreachableError("Capability file is not an object.");
  }

  const candidate = parsed as Record<string, unknown>;
  const { version, socketPath, token, pid } = candidate;

  if (typeof version !== "number" || version !== 1) {
    throw new ClessiraUnreachableError(
      `Unsupported capability version: ${String(version)}.`,
    );
  }
  if (typeof socketPath !== "string" || socketPath.length === 0) {
    throw new ClessiraUnreachableError("Capability file missing socketPath.");
  }
  if (typeof token !== "string" || token.length === 0) {
    throw new ClessiraUnreachableError("Capability file missing token.");
  }
  if (typeof pid !== "number" || !Number.isInteger(pid)) {
    throw new ClessiraUnreachableError("Capability file missing pid.");
  }

  return { version, socketPath, token, pid };
}
