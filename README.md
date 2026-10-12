# FanBBS Web

Pure Vue 3 client for the local FanBBS rewrite. The application uses `/api/v1` by default and falls back to an explicitly labelled, deterministic feed preview only when that endpoint cannot be reached.

## Run

```sh
npm install
npm run dev
npm test
npm run build
```

During local development, Vite proxies `/api` to `http://127.0.0.1:8080`, so start the Go API on its default address before `npm run dev`. For a same-origin production deployment, serve `/api/v1` from the same host. Set `VITE_API_BASE` only when the deployment has an explicitly configured CORS policy.

## Implemented workflows

- Material 3 lavender community timeline with 推荐 / 最新 / 全局 feeds, category and tag routes, search and public profiles
- Registration, login, recovery codes, account/profile controls and device sessions
- Rich publishing, local media, detail, nested replies, reactions, reposts, bookmarks and curated collections
- Notifications, private conversations, moderation/admin tools and homepage configuration
- Non-payment catalog, cart, shipping-address snapshots, local fulfillment orders and manual tracking
- Non-cash community points, check-in, tasks, ranks and avatar frames
- Desktop navigation rail plus the approved mobile four-item bottom navigation and separate FAB

## Resilience and browser validation

`npm test` covers the request adapter and component interactions. `npm run test:e2e` runs desktop and mobile Chromium against the real local Go API. The browser suite exercises auth-gated action resumption, media publishing, replies, duplicate-submit suppression, interrupted-request retry, browser Back/Forward hydration, responsive landmarks and keyboard focus.

Cash payments, withdrawals, external fulfillment and other regulated financial capabilities remain disabled. The local order workflow never charges a payment method.

## Community design refresh

The local `feat/solian-inspired-ui` work is based on the pure Vue rewrite at
`c708fc1432d91dd84afc224b9f0669341cea430e`, rather than the legacy UniApp default
branch. `src/community.css` layers the new design over existing feature styles;
`src/UiIcon.vue` now renders the official Hugeicons free rounded-stroke icons.

The visual direction references the rendered public Solian timeline: calm white
surfaces, subtle lavender selection states, quiet dividers and a spacious
three-column desktop layout. FanBBS keeps its own identity and API. The mobile
layout preserves its existing four primary destinations and a separate publish
button; the menu exposes secondary destinations.

Included refinements: keyboard-operated feed tabs, a working mobile menu,
Escape dismissal and focus restoration for dialogs, visible reconnect/loading
states, derived category/topic sidebars, and protection against late post-detail
responses overwriting a newer destination. Sidebar topics come from loaded
posts, not invented popularity counts.

Historical validation notes are in `DESIGN-REVIEW.md`. The current Hugeicons
refresh, package licenses, fresh browser screenshots and test results are
documented in `HUGEICONS-REVIEW.md`.

## Inbox and author workspace

The October 11 continuation adds notification preferences and per-kind unread
filters, separate notification/chat counts, conversation unread badges, and a
private “我的稿件” workspace. Choose “提交审核” in the composer to submit a pending
post; review outcomes are available only through the author's private snapshot.

See `INTEGRATION-REVIEW.md` for provenance, live API contract coverage and the
current browser-launch blocker. The historical Hugeicons screenshots do not
verify this continuation. Run the isolated live checks with
`GO=/path/to/go ./scripts/test-local-api.sh --api-contract`.

### Author submission flow (October 12)

Composer can save a server draft. The author workspace now edits draft/rejected/published content, saves with If-Match, submits/re-submits with a reason, withdraws pending review before editing and deletes non-pending private drafts. Moderation queue filters include pending/rejected and display submission text. Requires the matching `/me/posts/{id}/review` backend. Vite build passed; browser/full regression acceptance has not run in this feature-first pass.
