import { showHUD } from "@raycast/api";

import { stopTracking } from "./lib/client";
import { reportError } from "./lib/feedback";

export default async function Command() {
  try {
    await stopTracking();
    await showHUD("⏹ Stopped tracking");
  } catch (err) {
    await reportError(err, "Could not stop tracking");
  }
}
