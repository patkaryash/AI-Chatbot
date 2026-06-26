# Project Roadmap: AI-Chatbot Improvements

> Target: Increment project maturity by ~0.2 through focused, high-impact improvements across security, reliability, testing, and developer experience.

---

## Phase 1: Security & Reliability (Immediate — Weeks 1–2)

| # | Initiative | Impact | Effort |
|---|-----------|--------|--------|
| 1.1 | **Remove hardcoded JWT_SECRET fallback** — Replace `'dev-only-change-me'` in `auth.middleware.js` and `user.model.js` with a runtime check that throws if `JWT_SECRET` is unset. Prevents auth bypass in production. | High | Low |
| 1.2 | **Add request input validation** — Use `express-validator` on all POST/PUT routes (registration, chat creation, messages) to prevent malformed data and NoSQL injection beyond `mongo-sanitize`. | High | Low |
| 1.3 | **Graceful Redis degradation** — The auth middleware fails open if Redis is unreachable. Add try/catch around `redisClient.get(token)` so a down Redis does not block all requests. | High | Low |
| 1.4 | **Socket.IO error handling** — Add `socket.on('error')` handlers and rate-limit socket events per user to prevent spam/broadcast storms. | Medium | Low |

## Phase 2: Testing & Quality (Weeks 2–3)

| # | Initiative | Impact | Effort |
|---|-----------|--------|--------|
| 2.1 | **Unit tests for backend services** — Add Jest + Supertest. Target: `chat.service.js`, `ai.service.js`, `user.service.js`. Aim for >60% coverage of business logic. | High | Medium |
| 2.2 | **API integration tests** — Cover auth flow, chat CRUD, message history, and `@ai` trigger with a test MongoDB instance (e.g., `mongodb-memory-server`). | High | Medium |
| 2.3 | **Frontend component tests** — Add Vitest + React Testing Library. Test `Home.jsx` message rendering, `AuthShell.jsx` route guards, and `ThemeProvider.jsx` state. | Medium | Medium |
| 2.4 | **Lint & format CI gate** — Add a GitHub Actions workflow that runs `eslint`, `prettier --check`, and `npm run build` on every PR. | Medium | Low |

## Phase 3: Observability & Operations (Weeks 3–4)

| # | Initiative | Impact | Effort |
|---|-----------|--------|--------|
| 3.1 | **Structured logging** — Replace `console.log` with a structured logger (e.g., `pino`) that includes request IDs, user IDs, and severity levels. | Medium | Low |
| 3.2 | **Metrics endpoint** — Add `/metrics` (Prometheus format) tracking: active sockets, messages/min, AI fallback rate, auth failure rate. | Medium | Low |
| 3.3 | **Health check depth** — Extend `/health` to verify MongoDB and Redis connectivity and return dependency status. | Medium | Low |
| 3.4 | **Error alerting** — Wire `error.middleware.js` to emit alerts (e.g., Sentry or a simple webhook) on 5xx errors. | Medium | Low |

## Phase 4: Features & UX (Weeks 4–6)

| # | Initiative | Impact | Effort |
|---|-----------|--------|--------|
| 4.1 | **Message search** — Add MongoDB text index on `message.content` and expose `GET /chat/:id/search?q=...` for full-text chat history search. | High | Medium |
| 4.2 | **Typing indicators** — Broadcast `typing:start` / `typing:stop` socket events when a user is composing a message. | Medium | Low |
| 4.3 | **Unread message badges** — Persist unread counts per chat and show them on the dashboard list. | Medium | Medium |
| 4.4 | **AI command expansion** — Beyond `@ai`, support `@ai summarize`, `@ai translate:es`, and `@ai code-review` with structured prompts. | High | Medium |
| 4.5 | **Message reactions** — Add emoji reactions to messages (similar to Slack/Discord). | Low | Medium |

## Phase 5: Performance & Scale (Weeks 6–8)

| # | Initiative | Impact | Effort |
|---|-----------|--------|--------|
| 5.1 | **Message pagination** — Paginate `GET /chat/:id/messages` with cursor-based pagination instead of loading entire history. | High | Medium |
| 5.2 | **Redis session store** — Move Socket.IO adapter to Redis so the app can scale horizontally across multiple server instances. | High | Medium |
| 5.3 | **Image/file upload** — Add S3-compatible storage integration for file attachments in messages. | Medium | High |
| 5.4 | **Bundle optimization** — Audit frontend bundle with `vite-bundle-visualizer`, lazy-load screens, and code-split large components. | Medium | Low |

---

## Success Criteria

- [ ] No hardcoded secrets in source code.
- [ ] Backend test coverage ≥ 60%.
- [ ] CI passes on every PR.
- [ ] `/health` reports database connectivity.
- [ ] Users can search chat history.
- [ ] AI supports at least 3 command variants.
- [ ] Frontend bundle size reduced by ≥ 15%.

---

*Generated for OPE-62. This roadmap is a living document — priorities should be re-evaluated after each phase.*
