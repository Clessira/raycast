import { Toast, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";

import { NowDoingLockedError, NowDoingUnreachableError } from "./errors";

/**
 * Surfaces an error as a Raycast toast, with friendlier copy for the two cases
 * a user can actually act on: the app being unreachable, and the license gate.
 */
export async function reportError(error: unknown, fallbackTitle: string): Promise<void> {
  if (error instanceof NowDoingUnreachableError) {
    await showToast({
      style: Toast.Style.Failure,
      title: "NowDoing not reachable",
      message: "Open NowDoing and enable the loopback API integration.",
    });
    return;
  }
  if (error instanceof NowDoingLockedError) {
    await showToast({
      style: Toast.Style.Failure,
      title: "NowDoing is locked",
      message: "Unlock NowDoing with a valid license, then try again.",
    });
    return;
  }
  await showFailureToast(error, { title: fallbackTitle });
}
