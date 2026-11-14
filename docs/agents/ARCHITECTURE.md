# Architecture

Command Copier is a Vue 3 / TypeScript frontend hosted in a Tauri 2 desktop app.

| Area | Owning source |
| --- | --- |
| Frontend startup | `src/main.ts` mounts `src/App.vue` |
| Main screen | `src/pages/Home.vue` owns search, group filtering, the native form dialog and unsaved-change guards |
| Create and edit form | `src/components/commands/CreateCommandForm.vue` |
| Grouped list, copy and deletion | `src/components/commands/ListCommands.vue` |
| State and persistence | `src/store/store.ts` |
| Native alerts and confirmation | `src/utils/sendAlert.ts`, `src/utils/confirmDialog.ts` |
| Desktop startup | `src-tauri/src/main.rs` calls `run` in `src-tauri/src/lib.rs` |
| Native permissions | `src-tauri/capabilities/default.json` |

## Data flow

The reactive store holds an object mapping group names to arrays of `{ command, description }`. Store mutations create the next collection, persist it under the browser localStorage key `commands`, then publish it to reactive state. Failed persistence leaves the existing collection unchanged; refresh reads that key. `Home.vue` derives filtered groups with original indices and passes them to the list. Commands are copied through `navigator.clipboard`; feedback is invalidated when the collection changes, and stale asynchronous results are ignored. The frontend does not execute stored shell commands.

Import keeps a hidden browser file input attached during selection, validates grouped command JSON and replaces the complete collection after persistence succeeds. Its completion promise and reactive `importing` flag cover selection, reading and publication. Completion and cancellation remove the input and clear the flag; failures show an error and preserve existing commands. The UI prevents opening create/edit forms during import. Refresh and Import consult the form discard guard before replacing data. Export uses the filesystem plugin to create or overwrite `commands.json` in Downloads. Changes here must preserve existing data on failure.

`App.vue` provides shared appearance tokens with `prefers-color-scheme`. `Home.vue` opens the native `<dialog>` with `showModal()`; close actions share the dirty-state guard.

The Rust entry point registers dialog, filesystem and shell plugins. Its `greet` command is template code; command management lives in the frontend. No database or application HTTP API was found.

---
last updated 2026-11-15 — UI usability upgrade
