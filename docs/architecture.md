# Architecture

LaunchDeck is intentionally dependency-free so the generated repository is easy to inspect, run, and extend.

## Runtime

The app is a Node HTTP server that serves both JSON APIs and static frontend assets. The default data store writes to `data/launches.json`; tests inject an in-memory store.

## Modules

- `src/server.js` wires HTTP, static file serving, and API routing.
- `src/routes/api.js` owns API route definitions.
- `src/http/router.js` provides small path-pattern routing with route params.
- `src/http/responses.js` centralizes JSON responses and request body parsing.
- `src/storage/jsonStore.js` provides file-backed and memory-backed launch stores.
- `src/domain/launch.js` validates and normalizes launch records.
- `src/domain/scoring.js` computes launch readiness.
- `src/domain/roadmap.js` builds launch timelines.
- `src/domain/metrics.js` summarizes a launch portfolio.
- `src/domain/brief.js` shapes AI launch brief prompts and fallback briefs.
- `src/integrations/openai.js` calls the OpenAI Responses API with Structured Outputs.
- `public/app.js` renders the dashboard and handles browser-side API interactions.

## Data Flow

1. The browser fetches `/api/launches` and `/api/portfolio`.
2. The API reads launch records from the configured store.
3. Domain modules enrich each launch with readiness scores and roadmap milestones.
4. The frontend renders launch cards, a detail board, and a canvas readiness chart.
5. Optional brief generation posts to `/api/brief`, which calls OpenAI only when a runtime key exists.

## Extension Ideas

- Add auth and team workspaces.
- Replace the JSON store with SQLite or Postgres.
- Send scheduled reminders for upcoming roadmap milestones.
- Add Product Hunt checklist import/export.
- Add social copy generation and experiment tracking.
