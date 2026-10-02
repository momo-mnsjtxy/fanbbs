# FanBBS Web

Pure Vue 3 community vertical slice. The application uses `/api/v1` by default and falls back to an explicitly labelled, deterministic local preview when the API cannot be reached.

## Run

```sh
npm install
npm run dev
npm test
npm run build
```

During local development, Vite proxies `/api` to `http://127.0.0.1:8080`, so start the Go API on its default address before `npm run dev`. For a same-origin production deployment, serve `/api/v1` from the same host. Set `VITE_API_BASE` only when the deployment has an explicitly configured CORS policy.

## Implemented slice

- Responsive Material 3 community feed with 推荐 / 最新 / 全局 filters
- Login, authenticated actions and API error states
- Create post with recoverable local draft
- Detail, comments, replies and optimistic likes
- Desktop top bar / navigation rail and mobile four-item bottom navigation / separate FAB
- Loading, empty, offline-preview and request failure states

Commercial, messaging, moderation and migration work remains disabled until its policy and server contracts are approved.
