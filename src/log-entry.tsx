import {
  Action,
  ActionPanel,
  Form,
  Icon,
  List,
  showHUD,
  useNavigation,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";

import { logEntry, searchActivities } from "./lib/client";
import { ClessiraUnreachableError } from "./lib/errors";
import { reportError } from "./lib/feedback";

interface Target {
  activityID?: string;
  name?: string;
  createIfMissing?: boolean;
  /** Display label for the chosen activity. */
  label: string;
}

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
  const unreachable = error instanceof ClessiraUnreachableError;

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Pick an activity to log time against…"
      throttle
    >
      {unreachable ? (
        <List.EmptyView
          icon={Icon.WifiDisabled}
          title="Clessira not reachable"
          description="Open the Clessira app and enable the loopback API integration."
        />
      ) : error ? (
        <List.EmptyView icon={Icon.Warning} title="Search failed" description={error.message} />
      ) : (
        <>
          {showCreate ? (
            <PickItem
              icon={Icon.PlusCircle}
              title={`Create “${trimmed}”`}
              subtitle="New activity"
              target={{ name: trimmed, createIfMissing: true, label: trimmed }}
            />
          ) : null}
          {items.map((item) => (
            <PickItem
              key={item.id}
              icon={Icon.Circle}
              title={item.name}
              subtitle={item.groupName ?? undefined}
              target={{ activityID: item.id, label: item.name }}
            />
          ))}
        </>
      )}
    </List>
  );
}

function PickItem(props: {
  icon: Icon;
  title: string;
  subtitle?: string;
  target: Target;
}) {
  const { push } = useNavigation();
  return (
    <List.Item
      icon={props.icon}
      title={props.title}
      subtitle={props.subtitle}
      actions={
        <ActionPanel>
          <Action
            title="Log Time…"
            icon={Icon.Clock}
            onAction={() => push(<LogEntryForm target={props.target} />)}
          />
        </ActionPanel>
      }
    />
  );
}

function LogEntryForm({ target }: { target: Target }) {
  const [durationError, setDurationError] = useState<string | undefined>();

  async function submit(values: { duration: string; note: string }) {
    const minutes = Number.parseInt(values.duration, 10);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setDurationError("Enter a positive number of minutes.");
      return;
    }
    try {
      const result = await logEntry({
        activityID: target.activityID,
        name: target.name,
        createIfMissing: target.createIfMissing,
        durationMinutes: minutes,
        note: values.note.trim() ? values.note.trim() : undefined,
      });
      await showHUD(`✓ Logged ${result.durationMinutes}m on ${result.activityName}`);
    } catch (err) {
      await reportError(err, "Could not log entry");
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Log Entry" icon={Icon.Clock} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Activity" text={target.label} />
      <Form.TextField
        id="duration"
        title="Duration (minutes)"
        placeholder="30"
        error={durationError}
        onChange={() => setDurationError(undefined)}
      />
      <Form.TextArea id="note" title="Note" placeholder="Optional note" />
    </Form>
  );
}
