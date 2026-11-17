# Local development and verification

Use npm with `package-lock.json`. Desktop development also requires Rust and the platform dependencies linked from the human-facing `README.md`.

| Task | Command |
| --- | --- |
| Install locked frontend dependencies | `npm ci` |
| Run frontend only | `npm run dev` |
| Run desktop app | `npm run dev:tauri` |
| Type-check and build frontend | `npm run build` |
| Build desktop bundles | `npm run build:tauri` |
| Run component and store behavior tests | `node --test tests/*.test.mjs` |
| Run import regression checks | `node tests/import-commands.mjs` |
| Lint frontend without rewriting files | `npm run lint` |

Copy `.env.example` to `.env` and set `DEV_PORT`. Vite reads it with `strictPort`. `npm run dev:tauri` loads `.env` through Node and runs `scripts/dev-tauri.js`, which passes a matching `build.devUrl` override to Tauri via `--config`. Child processes inherit the environment; no port is hardcoded in the Tauri configuration.

## Verification status

Run `npm run build`, `node --test tests/*.test.mjs`, and `node tests/import-commands.mjs` after frontend behavior changes. The tests use Node's built-in test runner, the installed TypeScript/Vue compiler and real Vue reactivity. Component tests render production SFCs through a small custom renderer; storage, clipboard and native confirmation boundaries are stubbed.

The suite covers persistence failure, intersecting search/group filters, original-index operations, copy feedback invalidation and delayed clipboard results, form validation and discard guards, import cancellation and delayed-reading cleanup, and accessible control names. There is no npm test script.

The independent gate passed the build, 23 tests and six import scenarios on 2026-11-15. Chromium screenshots and focus checks cover responsive light/dark layouts; they do not establish native WebKit clipboard/picker behavior, native dialog focus traversal/return, or live OS theme switching.

ESLint uses `eslint.config.js`. The `CI` workflow in `.github/workflows/ci.yml` runs on PRs targeting `dev` or `master`, using Node 24 and Ubuntu 22.04. Its `checks` job runs locked npm installation, lint, behavior tests, import regression checks, the frontend build, and `cargo check --locked` for the Tauri backend. Configure `checks` as a required status check in GitHub branch protection to enforce the gate. Installer builds remain in the release workflow.

## Dev-flow

Local branch and role settings live in `.dev-flow/config.json`. Local feature artifacts live under `docs/features/`; both directories are ignored. Bootstrap leaves changes uncommitted. Remote branch operations are reserved for the user under the current session's restrictions.

For release automation, read `DEPLOYMENT.md`.

---
last updated 2026-11-15 — UI usability upgrade
