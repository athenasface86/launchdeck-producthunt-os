# LaunchDeck Product Hunt OS

A polished launch command center for makers preparing a Product Hunt-style product launch, with scoring, roadmap planning, metrics, and OpenAI brief generation.

LaunchDeck is a polished, dependency-free launch command center for makers preparing a Product Hunt-style launch. It combines a static product dashboard, a Node API, launch scoring, timeline planning, sample launch data, and optional OpenAI-powered launch brief generation.

## What It Includes

- Launch portfolio dashboard with scorecards, timeline, task tracking, and metric summaries.
- API routes for launch creation, launch updates, task management, portfolio summaries, and AI brief generation.
- Domain modules for launch validation, scoring, roadmap generation, metrics, and brief shaping.
- A JSON-backed store with an in-memory test mode.
- OpenAI Responses API integration that reads `OPENAI_API_KEY` or `openai_api_key` at runtime.
- Node test coverage for domain logic, API behavior, and OpenAI request shaping.

## Quick Start

```powershell
npm test
npm start
```

Open `http://localhost:3000`.

## OpenAI Setup

The app works without an OpenAI key for normal launch management. To generate launch briefs:

```powershell
$env:OPENAI_API_KEY = "your_api_key_here"
# or
$env:openai_api_key = "your_api_key_here"
$env:OPENAI_MODEL = "gpt-5.5"
npm start
```

## API

- `GET /api/health`
- `GET /api/launches`
- `POST /api/launches`
- `GET /api/launches/:id`
- `PATCH /api/launches/:id`
- `POST /api/launches/:id/tasks`
- `GET /api/portfolio`
- `POST /api/brief`

## Product Direction

This is intended to feel like a credible Product Hunt launch product: useful on the first screen, opinionated about launch readiness, and designed around repeated founder/operator workflows rather than a landing page.
