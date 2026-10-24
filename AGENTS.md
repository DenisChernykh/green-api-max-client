# MAX chat project

- Follow the user-provided Node/pnpm and Context7 instructions.
- Runtime contract: Node 24.x and pnpm 11.15.1. Preserve PATH; use plain pnpm.
- Keep `docs/TASK.md` as the assignment source. `react-starter` is a read-only reference.
- This is a frontend calling GREEN-API directly. Do not add a backend, API generation, runtime mocks or a demo mode without a task requirement.
- Follow FSD: app → pages → widgets → features → entities → shared. Import slices through their `index.ts` public API.
- Use shared fields, buttons and dialogs; RHF + Zod own forms, entities own TanStack Query cache, features own mutations.
- API methods and response schemas live in `src/shared/api/`. Infer response types from Zod schemas.
- Keep token values out of query keys, logs and persisted browser state. No automatic retry of send mutations.
- Do not enter real credentials or send messages without user authorization for the recipient and content.
- Use `&&` for conditional JSX without an alternative, with boolean conditions. Do not add TSDoc unless requested.
- Complete `pnpm check` and browser checks of changed user flows before claiming readiness. Distinguish automated test results from a real MAX exchange.
