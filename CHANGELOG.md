# Clessira Changelog

## [Initial Version] - 2026-06-13

- Start Activity command with type-ahead search and create-if-missing.
- Stop Tracking command.
- Log Entry command (pick activity → duration + optional note).
- Status / Today command with inline stop and `⌘R` refresh.
- Self-contained HMAC-signed UDS client with zero-config capability-file
  discovery (`api-endpoint.json`), mirroring the VS Code extension and the
  first-party SDK wire contract.
- Friendly toast for a stale auth token (HTTP 401) alongside the unreachable
  and license-locked cases.
- Auth parity tests (Vitest) pinned to the shared SDK / Python / Swift
  signature vectors, guarding the canonical string against drift.
