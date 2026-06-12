import { Action, ActionPanel, Color, Icon, List, showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";

import { getCurrent, getStatus, stopTracking } from "./lib/client";
import { ClessiraUnreachableError } from "./lib/errors";
import { reportError } from "./lib/feedback";
import { elapsedSince, formatElapsed, formatSeconds } from "./lib/format";

export default function Command() {
  const { data, isLoading, error, revalidate } = usePromise(async () => {
    const [status, current] = await Promise.all([getStatus(), getCurrent()]);
    return { status, current };
  });

  if (error instanceof ClessiraUnreachableError) {
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          icon={Icon.WifiDisabled}
          title="Clessira not reachable"
          description="Open the Clessira app and enable the loopback API integration."
        />
      </List>
    );
  }

  const status = data?.status;
  const current = data?.current;

  const trackingAccessory = (() => {
    if (!status) {
      return undefined;
    }
    if (status.isOnBreak) {
      return { tag: { value: "On break", color: Color.Yellow } };
    }
    if (status.isTracking) {
      return { tag: { value: "Tracking", color: Color.Green } };
    }
    return { tag: { value: "Idle", color: Color.SecondaryText } };
  })();

  const refreshAction = (
    <Action
      title="Refresh"
      icon={Icon.ArrowClockwise}
      shortcut={{ modifiers: ["cmd"], key: "r" }}
      onAction={() => revalidate()}
    />
  );

  async function stop() {
    try {
      await stopTracking();
      await showToast({ style: Toast.Style.Success, title: "Stopped tracking" });
      revalidate();
    } catch (err) {
      await reportError(err, "Could not stop tracking");
    }
  }

  return (
    <List isLoading={isLoading}>
      <List.Section title="Status">
        <List.Item
          icon={Icon.Dot}
          title="Tracking"
          subtitle={status?.currentActivity?.activityName ?? "Nothing tracked"}
          accessories={trackingAccessory ? [trackingAccessory] : undefined}
          actions={
            <ActionPanel>
              {status?.isTracking ? (
                <Action title="Stop Tracking" icon={Icon.Stop} onAction={stop} />
              ) : null}
              {refreshAction}
            </ActionPanel>
          }
        />
        {current ? (
          <List.Item
            icon={Icon.Clock}
            title="Elapsed"
            subtitle={formatElapsed(elapsedSince(current.startedAt))}
            actions={<ActionPanel>{refreshAction}</ActionPanel>}
          />
        ) : null}
      </List.Section>
      <List.Section title="Today">
        <List.Item
          icon={Icon.Calendar}
          title="Total tracked"
          subtitle={status ? formatSeconds(status.todaySeconds) : "—"}
          actions={<ActionPanel>{refreshAction}</ActionPanel>}
        />
      </List.Section>
    </List>
  );
}
