import { fallbackBrief } from "../domain/brief.js";
import { addTaskToLaunch, mergeLaunch, normalizeLaunch } from "../domain/launch.js";
import { enrichLaunch, summarizePortfolio, buildMetricCards } from "../domain/metrics.js";
import { buildLaunchRoadmap } from "../domain/roadmap.js";
import { createRouter } from "../http/router.js";
import { readJson, sendError, sendJson } from "../http/responses.js";
import { generateLaunchBrief } from "../integrations/openai.js";

function requireLaunch(launch, id) {
  if (!launch) {
    const error = new Error(`Launch not found: ${id}`);
    error.status = 404;
    throw error;
  }
  return launch;
}

function presentLaunch(launch) {
  const enriched = enrichLaunch(launch);
  return {
    ...enriched,
    roadmap: buildLaunchRoadmap(enriched)
  };
}

export function createApiRouter({ store, env = process.env, fetchImpl = fetch }) {
  const router = createRouter();

  router.get("/api/health", async ({ response }) => {
    sendJson(response, 200, {
      ok: true,
      service: "launchdeck",
      time: new Date().toISOString()
    });
  });

  router.get("/api/launches", async ({ response }) => {
    const launches = await store.listLaunches();
    sendJson(response, 200, {
      launches: launches.map(presentLaunch)
    });
  });

  router.post("/api/launches", async ({ request, response }) => {
    const payload = await readJson(request);
    const launch = await store.saveLaunch(normalizeLaunch(payload));
    sendJson(response, 201, {
      launch: presentLaunch(launch)
    });
  });

  router.get("/api/launches/:id", async ({ params, response }) => {
    const launch = requireLaunch(await store.getLaunch(params.id), params.id);
    sendJson(response, 200, {
      launch: presentLaunch(launch)
    });
  });

  router.patch("/api/launches/:id", async ({ params, request, response }) => {
    const existing = requireLaunch(await store.getLaunch(params.id), params.id);
    const payload = await readJson(request);
    const updated = await store.saveLaunch(mergeLaunch(existing, payload));
    sendJson(response, 200, {
      launch: presentLaunch(updated)
    });
  });

  router.post("/api/launches/:id/tasks", async ({ params, request, response }) => {
    const existing = requireLaunch(await store.getLaunch(params.id), params.id);
    const payload = await readJson(request);
    const updated = await store.saveLaunch(addTaskToLaunch(existing, payload));
    sendJson(response, 201, {
      launch: presentLaunch(updated)
    });
  });

  router.get("/api/portfolio", async ({ response }) => {
    const launches = await store.listLaunches();
    sendJson(response, 200, {
      summary: summarizePortfolio(launches),
      metric_cards: buildMetricCards(launches)
    });
  });

  router.post("/api/brief", async ({ request, response }) => {
    const payload = await readJson(request);
    try {
      const brief = await generateLaunchBrief(payload, { env, fetchImpl });
      sendJson(response, 200, { brief, source: "openai" });
    } catch (error) {
      if (String(error.message).includes("OPENAI_API_KEY")) {
        sendJson(response, 200, { brief: fallbackBrief(payload), source: "fallback" });
        return;
      }
      throw error;
    }
  });

  return {
    async handle(request, response) {
      try {
        const handled = await router.handle(request, response);
        if (!handled) {
          return false;
        }
        return true;
      } catch (error) {
        sendError(response, error.status ?? 400, error.message);
        return true;
      }
    },
    routes: router.routes
  };
}
