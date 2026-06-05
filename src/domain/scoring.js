function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function assetScore(assets) {
  const weights = {
    demo: 25,
    screenshots: 25,
    founder_video: 20,
    press_kit: 15
  };
  return Object.entries(weights).reduce((score, [key, weight]) => score + (assets[key] ? weight : 0), 0);
}

function taskScore(tasks) {
  if (!tasks.length) {
    return 10;
  }
  const done = tasks.filter((task) => task.status === "done").length;
  const doing = tasks.filter((task) => task.status === "doing").length;
  return clamp((done / tasks.length) * 80 + (doing / tasks.length) * 30);
}

function audienceScore(launch) {
  let score = 0;
  if (launch.audience.length >= 20) score += 28;
  if (launch.positioning.length >= 36) score += 28;
  if (launch.tagline.length >= 18 && launch.tagline.length <= 90) score += 22;
  if (launch.channels.length >= 2) score += 22;
  return clamp(score);
}

function tractionScore(metrics) {
  const waitlist = clamp((metrics.waitlist / 1000) * 35, 0, 35);
  const beta = clamp((metrics.beta_users / 150) * 25, 0, 25);
  const activation = clamp(metrics.activation_rate * 25, 0, 25);
  const retention = clamp(metrics.retention_rate * 15, 0, 15);
  return waitlist + beta + activation + retention;
}

function riskPenalty(launch) {
  const unresolvedRisks = launch.risks.length * 5;
  const missingDate = launch.launch_date ? 0 : 10;
  return clamp(unresolvedRisks + missingDate, 0, 30);
}

export function calculateLaunchScore(launch) {
  const dimensions = {
    audience: Math.round(audienceScore(launch)),
    assets: Math.round(assetScore(launch.assets)),
    tasks: Math.round(taskScore(launch.tasks)),
    traction: Math.round(tractionScore(launch.metrics))
  };
  const weighted =
    dimensions.audience * 0.28 +
    dimensions.assets * 0.24 +
    dimensions.tasks * 0.22 +
    dimensions.traction * 0.26;
  const score = Math.round(clamp(weighted - riskPenalty(launch)));

  return {
    score,
    grade: score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D",
    dimensions,
    blockers: buildBlockers(launch, dimensions)
  };
}

export function buildBlockers(launch, dimensions) {
  const blockers = [];
  if (dimensions.assets < 55) blockers.push("Ship missing launch assets.");
  if (dimensions.audience < 60) blockers.push("Tighten audience and positioning.");
  if (dimensions.tasks < 55) blockers.push("Close more launch tasks.");
  if (dimensions.traction < 45) blockers.push("Grow beta or waitlist proof.");
  if (!launch.launch_date) blockers.push("Set a launch date.");
  return blockers;
}
