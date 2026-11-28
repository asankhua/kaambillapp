# api/: endpoint entry points

Each file here is a one-line re-export of the endpoint implemented in its phase folder. `npm start` (production, Render) and `npm run dev:api` (local) serve them; the layout also matches what Vercel expects.

| Route                      | Implemented in                                   |
| -------------------------- | ------------------------------------------------ |
| `GET /api/health`          | `phase-0-setup/server/health.ts`                 |
| `POST /api/extract`        | `phase-3-understanding/server/extract.ts`        |
| `POST /api/rehearsal/todo` | `phase-7-domain-sprint/server/rehearsal-todo.ts` |
