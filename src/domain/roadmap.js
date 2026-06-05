const day = 24 * 60 * 60 * 1000;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function offsetDate(date, offsetDays) {
  return formatDate(new Date(date.getTime() + offsetDays * day));
}

export function buildLaunchRoadmap(launch) {
  const baseDate = launch.launch_date ? new Date(`${launch.launch_date}T12:00:00Z`) : new Date();
  const remainingTasks = launch.tasks.filter((task) => task.status !== "done");

  return [
    {
      key: "story-lock",
      label: "Lock story and target user",
      due: offsetDate(baseDate, -21),
      status: launch.positioning.length > 36 ? "done" : "todo"
    },
    {
      key: "proof-assets",
      label: "Finish demo, screenshots, and proof points",
      due: offsetDate(baseDate, -14),
      status: launch.assets.demo && launch.assets.screenshots ? "done" : "doing"
    },
    {
      key: "community-warmup",
      label: "Warm launch channels and early supporters",
      due: offsetDate(baseDate, -10),
      status: launch.channels.length >= 2 ? "doing" : "todo"
    },
    {
      key: "final-polish",
      label: "Close launch checklist",
      due: offsetDate(baseDate, -4),
      status: remainingTasks.length <= 1 ? "done" : "doing"
    },
    {
      key: "launch-day",
      label: "Launch, respond, and capture feedback",
      due: formatDate(baseDate),
      status: launch.status === "launched" ? "done" : "todo"
    }
  ];
}

export function nextMilestone(launch) {
  return buildLaunchRoadmap(launch).find((item) => item.status !== "done") ?? null;
}
