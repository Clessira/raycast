# AGENTS.md

## Purpose

Repository-wide instructions for coding agents working on the NowDoing Raycast
extension. Actionable: how to work, what to run, and what to keep in sync.

## Repository Context

- This repository is a Raycast extension for NowDoing.
- Each command's entrypoint is `src/<command-name>.tsx`, matching the `name`
  field in `package.json`'s `commands` array.
- Shared logic lives under `src/lib/` (API client, auth, types, formatting).
- Built and run with the Raycast CLI (`ray`).

## The wire protocol is shared — do not drift

This extension is a **consumer** of NowDoing's loopback API (`BranchChangeServer`
in the Mac app). The HMAC canonical string, header names, capability-file format,
and request/response shapes are also implemented in the Swift app, the VS Code
extension, and the `@clessira/sdk` JS/Python SDKs.

- `src/lib/auth.ts`, `src/lib/types.ts`, and `src/lib/errors.ts` intentionally
  mirror `@clessira/sdk` (js). The SDK is **not** a dependency — it is
  TCP/`fetch`-only and cannot use the zero-config Unix-domain-socket discovery
  this extension relies on — so the protocol code is mirrored, not imported.
- Any change to the wire contract is a cross-cutting change owned by the Mac
  app. Do **not** unilaterally change the signing scheme, header names, or
  payload shapes here; follow the app's `wire-protocol-change` process and keep
  all clients in lockstep.

## Delivery Standard

- Prefer root-cause fixes over surface patches; keep changes minimal and
  production-ready.
- Preserve the existing architecture unless there is a concrete defect.
- Avoid unrelated refactors.

## Required Commands

- Install dependencies: `npm install`
- Develop (hot reload into Raycast): `npm run dev`
- Lint: `npm run lint`
- Auto-fix lint: `npm run fix-lint`
- Build (validates the manifest + TypeScript): `npm run build`

Note: `ray` requires macOS with Raycast installed; the build/lint gate cannot
run on Linux CI hosts.

## File Update Rules

- Update `CHANGELOG.md` whenever shipped behavior, commands, or requirements
  change. Newest entry on top; the top entry may use the `[Initial Version]` /
  `[Unreleased]` heading Raycast's store tooling expects.
- Keep `README.md` aligned with the command list and requirements.
- Do not edit generated outputs (`dist/`, `raycast-env.d.ts`) by hand.

## Store Compliance

Keep the extension Raycast-Store-ready even though submission is a later step:
English UI throughout, MIT `LICENSE`, a 512×512 `assets/icon.png`, and complete
`package.json` manifest fields (`title`, `description`, `icon`, `author`,
`categories`, `license`, per-command `title`/`description`).

## Response Expectations

- Report what changed, how it was validated, and any remaining risk.
- If `ray`/`npm` commands could not be run (e.g. non-macOS host), say so plainly.
