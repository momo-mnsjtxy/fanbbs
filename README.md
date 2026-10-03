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

- Material 3 forest-teal community timeline with 推荐 / 最新 / 全局 feeds, category and tag routes, search and public profiles
- Registration, login, recovery codes, account/profile controls and device sessions
- Rich publishing, local media, detail, nested replies, reactions, reposts, bookmarks and curated collections
- Notifications, private conversations, moderation/admin tools and homepage configuration
- Non-payment catalog, cart, shipping-address snapshots, local fulfillment orders and manual tracking
- Non-cash community points, check-in, tasks, ranks and avatar frames
- Desktop navigation rail plus the approved mobile four-item bottom navigation and separate FAB

## Resilience and browser validation

`npm test` covers the request adapter and component interactions. `npm run test:e2e` runs desktop and mobile Chromium against the real local Go API. The browser suite exercises auth-gated action resumption, media publishing, replies, duplicate-submit suppression, interrupted-request retry, browser Back/Forward hydration, responsive landmarks and keyboard focus.

Cash payments, withdrawals, external fulfillment and other regulated financial capabilities remain disabled. The local order workflow never charges a payment method.
