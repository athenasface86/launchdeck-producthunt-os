import assert from "node:assert/strict";
import { test } from "node:test";
import { fallbackBrief } from "../src/domain/brief.js";
import { addTaskToLaunch, normalizeLaunch } from "../src/domain/launch.js";
import { buildMetricCards, summarizePortfolio } from "../src/domain/metrics.js";
import { buildLaunchRoadmap } from "../src/domain/roadmap.js";
import { calculateLaunchScore } from "../src/domain/scoring.js";

const launch = normalizeLaunch({
  id: "demo",
  name: "Demo Launch",
  tagline: "A launch workspace for serious makers.",
  audience: "founders preparing Product Hunt launches",
  positioning: "A command center that turns launch work into a prioritized scorecard.",
  launch_date: "2026-08-01",
  channels: ["Product Hunt", "newsletter"],
  assets: { demo: true, screenshots: true, press_kit: true },
  metrics: { waitlist: 600, beta_users: 80, activation_rate: 0.5, retention_rate: 0.35 },
  risks: ["Video incomplete"],
  tasks: [
    { title: "Write story", status: "done" },
    { title: "Record demo", status: "doing" }
  ]
});

test("normalizeLaunch applies defaults and validates required fields", () => {
  assert.equal(launch.id, "demo");
  assert.equal(launch.status, "planning");
  assert.equal(launch.tasks.length, 2);
  assert.throws(() => normalizeLaunch({ tagline: "missing name" }), /name is required/);
});

test("calculateLaunchScore returns grade, dimensions, and blockers", () => {
  const readiness = calculateLaunchScore(launch);

  assert.ok(readiness.score > 50);
  assert.match(readiness.grade, /^[A-D]$/);
  assert.ok(readiness.dimensions.assets > 40);
  assert.ok(Array.isArray(readiness.blockers));
});

test("buildLaunchRoadmap creates launch-relative milestones", () => {
  const roadmap = buildLaunchRoadmap(launch);

  assert.equal(roadmap.at(-1).due, "2026-08-01");
  assert.equal(roadmap.length, 5);
});

test("portfolio summary and metric cards aggregate launches", () => {
  const summary = summarizePortfolio([launch]);
  const cards = buildMetricCards([launch]);

  assert.equal(summary.launch_count, 1);
  assert.equal(summary.total_waitlist, 600);
  assert.equal(cards.length, 4);
});

test("addTaskToLaunch appends normalized tasks", () => {
  const updated = addTaskToLaunch(launch, { title: "Recruit early supporters" });

  assert.equal(updated.tasks.length, 3);
  assert.equal(updated.tasks.at(-1).status, "todo");
});

test("fallbackBrief gives useful output when OpenAI is not configured", () => {
  const brief = fallbackBrief({
    idea: "A workspace that helps founders get ready for a public product launch.",
    audience: "founders"
  });

  assert.equal(brief.target_user, "founders");
  assert.ok(brief.checklist.length >= 4);
});
