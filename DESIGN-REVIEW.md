# FanBBS community design refresh

## Scope

A local implementation of a Solian-inspired visual refresh for the existing pure
Vue 3 FanBBS client. FanBBS branding, existing API contracts and feature workflows
are retained. There is no UniApp dependency or new runtime dependency.

Base: `ci/rewrite-validation` at `c708fc1432d91dd84afc224b9f0669341cea430e`.
The remote default `dev` branch remains the older UniApp application. This patch
must be applied to the Vue rewrite base, not blindly to `dev`.
Local branch: `feat/solian-inspired-ui`. No push, PR, merge or deployment performed.

## Design

Reference research inspected the actual rendered public pages at
https://solian.app/ and https://solian.app/timeline. The first is a marketing
landing page; the timeline provides the relevant community interface direction.
Its white continuous feed, quiet gray borders, muted lavender accents, outline
icons and spacious three-column desktop layout informed this implementation.
Solian's mobile interface was not verified; FanBBS retains its own four-item
mobile navigation and separate publish action.

Changes include:
- Desktop brand/search header, comfortable labeled navigation and contextual
  sidebars, responsive down to a single-column mobile layout
- A softer welcome panel, coherent outline icons, calmer post hierarchy,
  readable action rows, media treatment and post detail/reply surfaces
- Categories and topic chips derived from actual loaded posts; no fabricated
  popularity or member counts
- A working mobile secondary-navigation drawer, retained publishing controls,
  and consistent discover/profile/message/admin/shop surfaces
- Loading skeletons, a reconnect action for explicitly labelled offline preview,
  and visible post-loading status
- Feed tab arrow/Home/End keyboard controls and selected tab semantics,
  dialog Escape dismissal, focus containment and focus restoration
- Separate detail loading state, stale response protection, and correct
  following-feed to home reset, plus navigation-safe completion of root and
  nested replies

## Verification boundaries

The backend used for local integration is the frontend CI-pinned Go API at
`85df66d9976e16ede678645e7f46f60059fdbf23`, with a fresh SQLite database and
synthetic seed data. No production backend or account was used.

The final run passed all 66 tests: 16 request-adapter tests and 50 component
tests, including 9 new navigation, keyboard, dialog and interrupted-reply
regressions. The bundled test log records that run.
The production Vite build and whitespace/syntax checks were also run. There is no
configured standalone lint or TypeScript-check script in this repository.

Independent API checks exercised the unchanged request adapter against the real
local Go API: feed modes, category filtering, registration/recovery-code return,
profile, publishing, detail, replying, liking, bookmarking and refresh rotation.
Backend `go test ./...` passed.

Browser execution remains blocked by the runtime: Playwright Chromium fails at
startup with a socket permission error, including the approved execution retry;
the supported cloud browser rejects the localhost preview with
`net::ERR_BLOCKED_BY_CLIENT`. These are environment blockers, not passing E2E.
There are therefore no desktop/mobile screenshots in this delivery, and no claim
of pixel-level visual QA, real-browser focus behavior or completed browser E2E.
Component tests and HTTP integration do not replace those checks.

## Review and run

Apply `fanbbs-solian.patch` to the exact Vue rewrite base, or use the included
complete source directory. Run `npm ci`, `npm test`, and `npm run build`.

For a local preview, start the pinned Go API at `127.0.0.1:8080`, then run
`npm run dev` and open `http://127.0.0.1:4173`. Without the API, the existing
explicitly-labelled offline preview is used.

Before publishing, run `npm run test:e2e` in a browser-capable environment and
visually inspect desktop (1440px), intermediate (1024px), mobile (390px) and
narrow mobile (320px). Review sticky headers, overflow, text wrapping, focus
rings, mobile menu dismissal, dialog interruption, browser Back/Forward,
repeated feed changes, media, and reply submission/error recovery. A fresh local
database is required for the browser suite's fixed synthetic account names.

The original business functionality remains available. This UI work does not
activate cash payments, withdrawals or external fulfillment.
