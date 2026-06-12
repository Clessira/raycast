import { Toast, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";

import { ClessiraLockedError, ClessiraUnreachableError } from "./errors";

/**
 * Surfaces an error as a Raycast toast, with friendlier copy for the two cases
 * a user can actually act on: the app being unreachable, and the license gate.
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
