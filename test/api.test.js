import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "../src/server.js";
import { createMemoryStore } from "../src/storage/jsonStore.js";

const seed = [
  {
    id: "demo",
    name: "Demo Launch",
    tagline: "A useful launch workspace.",
    audience: "founders",
    positioning: "A launch command center for focused teams.",
    launch_date: "2026-08-01",
    status: "building",
    channels: ["Product Hunt", "newsletter"],
    assets: { demo: true, screenshots: true },
    metrics: { waitlist: 200, beta_users: 24, activation_rate: 0.4, retention_rate: 0.25 },
    risks: [],
    tasks: [{ id: "task-a", title: "Write story", status: "done" }]
  }
];

async function withServer(callback) {
  const store = createMemoryStore(seed);
  const server = createServer({ store, publicDir: new URL("../public", import.meta.url).pathname });
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test("health and launch list endpoints return enriched launches", async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);

    const response = await fetch(`${baseUrl}/api/launches`);
    const payload = await response.json();
    assert.equal(payload.launches.length, 1);
    assert.equal(payload.launches[0].id, "demo");
    assert.ok(payload.launches[0].readiness.score >= 0);
    assert.equal(payload.launches[0].roadmap.length, 5);
  });
});

test("launches can be created and tasks can be added", async () => {
  await withServer(async (baseUrl) => {
    const create = await fetch(`${baseUrl}/api/launches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "new-launch",
        name: "New Launch",
        tagline: "Ship a launch that feels prepared.",
        audience: "makers",
        channels: ["Product Hunt"]
      })
    });
    assert.equal(create.status, 201);

    const task = await fetch(`${baseUrl}/api/launches/new-launch/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Invite launch supporters", owner: "growth" })
    });
    const payload = await task.json();
    assert.equal(task.status, 201);
    assert.equal(payload.launch.tasks.at(-1).owner, "growth");
  });
});

test("brief endpoint falls back when OpenAI key is not set", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/brief`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idea: "A product launch workspace that prioritizes the next best launch task."
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.source, "fallback");
    assert.ok(payload.brief.checklist.length >= 4);
  });
});
