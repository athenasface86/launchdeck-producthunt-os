export function buildBriefInput(payload = {}) {
  const idea = String(payload.idea ?? "").replace(/\s+/g, " ").trim();
  if (idea.length < 20) {
    throw new Error("idea must be at least 20 characters.");
  }
  if (idea.length > 1800) {
    throw new Error("idea must be 1800 characters or fewer.");
  }

  return {
    idea,
    audience: String(payload.audience ?? "early adopters").trim(),
    constraints: Array.isArray(payload.constraints) ? payload.constraints.map(String) : [],
    channels: Array.isArray(payload.channels) ? payload.channels.map(String) : ["Product Hunt"]
  };
}

export function fallbackBrief(input) {
  const brief = buildBriefInput(input);
  return {
    product_name: "Launch Candidate",
    tagline: brief.idea.slice(0, 90),
    target_user: brief.audience,
    launch_angle: "Focus the story on one painful workflow and the measurable outcome users get on day one.",
    product_hunt_hook: "A compact workflow that helps makers move from idea to launch with less drift.",
    checklist: [
      "Write a one-sentence promise",
      "Record a short demo",
      "Collect three proof points",
      "Recruit ten early supporters"
    ],
    risks: [
      "The story may be too broad",
      "The launch assets may not show the product clearly"
    ]
  };
}
