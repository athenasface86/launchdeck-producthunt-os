import crypto from "node:crypto";

const taskStatuses = new Set(["todo", "doing", "done"]);
const launchStatuses = new Set(["planning", "building", "launching", "launched", "paused"]);

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback).replace(/\s+/g, " ").trim();
}

function normalizeList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => cleanText(item)).filter(Boolean);
}

export function normalizeTask(input = {}) {
  const title = cleanText(input.title);
  if (!title) {
    throw new Error("task.title is required.");
  }

  const status = taskStatuses.has(input.status) ? input.status : "todo";
  return {
    id: input.id ?? `task-${crypto.randomUUID().slice(0, 8)}`,
    title,
    owner: cleanText(input.owner, "unassigned"),
    status,
    due: cleanText(input.due)
  };
}

export function normalizeLaunch(input = {}) {
  const name = cleanText(input.name);
  if (!name) {
    throw new Error("name is required.");
  }

  const tagline = cleanText(input.tagline);
  if (!tagline) {
    throw new Error("tagline is required.");
  }

  const id = cleanText(input.id) || `${slugify(name)}-${crypto.randomUUID().slice(0, 6)}`;
  const status = launchStatuses.has(input.status) ? input.status : "planning";
  const metrics = input.metrics ?? {};
  const assets = input.assets ?? {};

  return {
    id,
    name,
    tagline,
    audience: cleanText(input.audience, "early adopters"),
    positioning: cleanText(input.positioning, tagline),
    launch_date: cleanText(input.launch_date),
    status,
    channels: normalizeList(input.channels),
    assets: {
      demo: Boolean(assets.demo),
      screenshots: Boolean(assets.screenshots),
      founder_video: Boolean(assets.founder_video),
      press_kit: Boolean(assets.press_kit)
    },
    metrics: {
      waitlist: Number(metrics.waitlist ?? 0),
      beta_users: Number(metrics.beta_users ?? 0),
      activation_rate: Number(metrics.activation_rate ?? 0),
      retention_rate: Number(metrics.retention_rate ?? 0)
    },
    risks: normalizeList(input.risks),
    tasks: Array.isArray(input.tasks) ? input.tasks.map(normalizeTask) : []
  };
}

export function mergeLaunch(existing, patch) {
  return normalizeLaunch({
    ...existing,
    ...patch,
    assets: { ...existing.assets, ...patch.assets },
    metrics: { ...existing.metrics, ...patch.metrics },
    tasks: patch.tasks ?? existing.tasks
  });
}

export function addTaskToLaunch(launch, task) {
  return normalizeLaunch({
    ...launch,
    tasks: [...launch.tasks, normalizeTask(task)]
  });
}
