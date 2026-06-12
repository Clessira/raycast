// Wire types of the NowDoing loopback API. Mirrors `@clessira/sdk` (js) and the
// Swift `BranchChangeServer+WireTypes` so all clients stay in lockstep. This is
// a consumer of the existing v1 contract — no wire-protocol change.

export interface CurrentActivity {
  activityID: string;
  activityName: string;
  /** ISO-8601 timestamp, e.g. "2026-05-24T10:00:00Z". */
  startedAt: string;
  isOnBreak: boolean;
}

export interface ActivitySearchItem {
  id: string;
  name: string;
  groupName: string | null;
}

export interface StartActivityRequest {
  activityID?: string;
  name?: string;
  createIfMissing?: boolean;
}

export interface StartActivityResult {
  activityID: string;
  activityName: string;
  created: boolean;
}

export interface StatusActivity {
  activityID: string;
  activityName: string;
}

export interface Status {
  isTracking: boolean;
  isOnBreak: boolean;
  currentActivity: StatusActivity | null;
  /** Tracked seconds across today, regardless of whether tracking is active right now. */
  todaySeconds: number;
}

export interface LogEntryRequest {
  activityID?: string;
  name?: string;
  durationMinutes: number;
  note?: string;
  createIfMissing?: boolean;
}

export interface LogEntryResult {
  entryID: string;
  activityID: string;
  activityName: string;
  durationMinutes: number;
  created: boolean;
}
