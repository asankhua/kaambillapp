# api/: Vercel entry points

Vercel only serves functions from `api/` at the repo root, so each file here is a one-line re-export of the endpoint implemented in its phase folder.

| Route                      | Implemented in                                   |
| -------------------------- | ------------------------------------------------ |
| `GET /api/health`          | `phase-0-setup/server/health.ts`                 |
| `POST /api/extract`        | `phase-3-understanding/server/extract.ts`        |
| `POST /api/rehearsal/todo` | `phase-7-domain-sprint/server/rehearsal-todo.ts` |
| `POST /api/stt`            | `phase-8-finale/server/stt.ts`                   |
