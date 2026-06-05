import { calculateLaunchScore } from "./scoring.js";
import { nextMilestone } from "./roadmap.js";

export function enrichLaunch(launch) {
  return {
    ...launch,
    readiness: calculateLaunchScore(launch),
    next_milestone: nextMilestone(launch)
  };
}

export function summarizePortfolio(launches) {
  const enriched = launches.map(enrichLaunch);
  const totalWaitlist = enriched.reduce((sum, launch) => sum + launch.metrics.waitlist, 0);
  const avgScore = enriched.length
    ? Math.round(enriched.reduce((sum, launch) => sum + launch.readiness.score, 0) / enriched.length)
    : 0;
  const openTasks = enriched.reduce(
    (sum, launch) => sum + launch.tasks.filter((task) => task.status !== "done").length,
    0
  );

  return {
    launch_count: enriched.length,
    total_waitlist: totalWaitlist,
    average_readiness: avgScore,
    open_tasks: openTasks,
    strongest_launch: [...enriched].sort((a, b) => b.readiness.score - a.readiness.score)[0] ?? null,
    at_risk: enriched.filter((launch) => launch.readiness.score < 60)
  };
}

export function buildMetricCards(launches) {
  const summary = summarizePortfolio(launches);
  return [
    { label: "Launches", value: String(summary.launch_count), tone: "neutral" },
    { label: "Waitlist", value: summary.total_waitlist.toLocaleString("en-US"), tone: "growth" },
    { label: "Avg readiness", value: `${summary.average_readiness}%`, tone: "focus" },
    { label: "Open tasks", value: String(summary.open_tasks), tone: "risk" }
  ];
}
