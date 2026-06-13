import { Toast, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";

import {
  ClessiraAuthError,
  ClessiraLockedError,
  ClessiraUnreachableError,
} from "./errors";

/**
 * Surfaces an error as a Raycast toast, with friendlier copy for the three
 * cases a user can actually act on: the app being unreachable, a stale auth
 * token, and the license gate.
 */
export async function reportError(error: unknown, fallbackTitle: string): Promise<void> {
  if (error instanceof ClessiraUnreachableError) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Clessira not reachable",
      message: "Open Clessira and enable the loopback API integration.",
    });
    return;
  }
  if (error instanceof ClessiraAuthError) {
    // 401 — the capability file's token no longer matches the running server
    // (app restarted, token rotated, or the integration was toggled off/on).
    await showToast({
      style: Toast.Style.Failure,
      title: "Clessira rejected the request",
      message: "The connection token may have changed. Reopen Clessira, then try again.",
    });
    return;
  }
  if (error instanceof ClessiraLockedError) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Clessira is locked",
      message: "Unlock Clessira with a valid license, then try again.",
    });
    return;
  }
  await showFailureToast(error, { title: fallbackTitle });
}
