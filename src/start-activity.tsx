import { Action, ActionPanel, Icon, List, showHUD } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";

import { searchActivities, startActivity } from "./lib/client";
import { ClessiraUnreachableError } from "./lib/errors";
import { reportError } from "./lib/feedback";
import type { StartActivityRequest } from "./lib/types";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { data, isLoading, error } = usePromise(
    (query: string) => searchActivities(query, 20),
    [searchText],
  );

  const items = data ?? [];
  const trimmed = searchText.trim();
  const hasExactMatch = items.some(
    (item) => item.name.localeCompare(trimmed, undefined, { sensitivity: "accent" }) === 0,
  );
  const showCreate = trimmed.length > 0 && !hasExactMatch;

  async function start(request: StartActivityRequest) {
    try {
      const result = await startActivity(request);
      await showHUD(
        result.created
          ? `▶ Created and started: ${result.activityName}`
          : `▶ Started: ${result.activityName}`,
      );
    } catch (err) {
      await reportError(err, "Could not start activity");
    }
  }

  const unreachable = error instanceof ClessiraUnreachableError;

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search activities…"
      throttle
    >
      {unreachable ? (
        <List.EmptyView
          icon={Icon.WifiDisabled}
          title="Clessira not reachable"
          description="Open the Clessira app and enable the loopback API integration."
        />
      ) : error ? (
        <List.EmptyView
          icon={Icon.Warning}
          title="Search failed"
          description={error.message}
        />
      ) : (
        <>
          {showCreate ? (
            <List.Item
              icon={Icon.PlusCircle}
              title={`Create “${trimmed}”`}
              subtitle="New activity"
              actions={
                <ActionPanel>
                  <Action
                    title="Create and Start"
                    icon={Icon.Play}
                    onAction={() => start({ name: trimmed, createIfMissing: true })}
                  />
                </ActionPanel>
              }
            />
          ) : null}
          {items.map((item) => (
            <List.Item
              key={item.id}
              icon={Icon.Circle}
              title={item.name}
              subtitle={item.groupName ?? undefined}
              actions={
                <ActionPanel>
                  <Action
                    title="Start Activity"
                    icon={Icon.Play}
                    onAction={() => start({ activityID: item.id })}
                  />
                </ActionPanel>
              }
            />
          ))}
        </>
      )}
    </List>
  );
}
