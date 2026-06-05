const state = {
  launches: [],
  selectedId: null,
  metricCards: []
};

const elements = {
  metricGrid: document.querySelector("#metric-grid"),
  launchList: document.querySelector("#launch-list"),
  launchCount: document.querySelector("#launch-count"),
  detailBoard: document.querySelector("#detail-board"),
  quickAdd: document.querySelector("#quick-add"),
  briefForm: document.querySelector("#brief-form"),
  briefOutput: document.querySelector("#brief-output"),
  briefSource: document.querySelector("#brief-source"),
  canvas: document.querySelector("#readiness-canvas")
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload;
}

function renderMetricCards() {
  elements.metricGrid.replaceChildren(
    ...state.metricCards.map((card) => {
      const article = document.createElement("article");
      article.className = `metric-card ${card.tone}`;
      article.innerHTML = `<span>${card.label}</span><strong>${card.value}</strong>`;
      return article;
    })
  );
}

function renderLaunchList() {
  elements.launchCount.textContent = String(state.launches.length);
  elements.launchList.replaceChildren(
    ...state.launches.map((launch) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `launch-card${launch.id === state.selectedId ? " active" : ""}`;
      button.innerHTML = `
        <strong>${launch.name}</strong>
        <span>${launch.tagline}</span>
      `;
      button.addEventListener("click", () => {
        state.selectedId = launch.id;
        render();
      });
      return button;
    })
  );
}

function itemList(items) {
  if (!items.length) {
    return "<p>No items yet.</p>";
  }
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderDetail() {
  const launch = state.launches.find((item) => item.id === state.selectedId) ?? state.launches[0];
  if (!launch) {
    elements.detailBoard.innerHTML = "<p>No launches yet.</p>";
    return;
  }

  state.selectedId = launch.id;
  const blockers = launch.readiness.blockers;
  elements.detailBoard.innerHTML = `
    <div class="score-row">
      <div class="score-dial" style="--score:${launch.readiness.score}">
        <strong>${launch.readiness.score}</strong>
      </div>
      <div>
        <p class="eyebrow">Grade ${launch.readiness.grade}</p>
        <h2>${launch.name}</h2>
        <p class="tagline">${launch.tagline}</p>
        <div class="pill-row">
          <span class="pill">${launch.status}</span>
          <span class="pill">${launch.launch_date || "date unset"}</span>
          <span class="pill">${launch.metrics.waitlist.toLocaleString("en-US")} waitlist</span>
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <article class="panel">
        <h3>Positioning</h3>
        <p>${launch.positioning}</p>
      </article>
      <article class="panel">
        <h3>Channels</h3>
        ${itemList(launch.channels)}
      </article>
      <article class="panel">
        <h3>Blockers</h3>
        ${itemList(blockers)}
      </article>
      <article class="panel">
        <h3>Risks</h3>
        ${itemList(launch.risks)}
      </article>
      <article class="panel roadmap">
        <h3>Roadmap</h3>
        ${launch.roadmap.map((item) => `
          <div class="roadmap-item">
            <strong>${item.due}</strong>
            <span>${item.label}</span>
            <span>${item.status}</span>
          </div>
        `).join("")}
      </article>
    </div>
  `;
}

function drawReadinessChart(timestamp = 0) {
  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#eef3ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(23, 33, 29, 0.08)";
  for (let x = 60; x < canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 32);
    ctx.lineTo(x, canvas.height - 32);
    ctx.stroke();
  }

  state.launches.forEach((launch, index) => {
    const baseX = 90 + index * 310;
    const score = launch.readiness.score;
    const height = Math.max(20, score * 2.3);
    const y = canvas.height - 56 - height;
    const color = score >= 70 ? "#1f6f78" : score >= 55 ? "#b57a22" : "#b54c25";

    ctx.fillStyle = color;
    ctx.fillRect(baseX, y + Math.sin(timestamp * 0.002 + index) * 3, 92, height);
    ctx.fillStyle = "#17211d";
    ctx.font = "800 22px Inter, sans-serif";
    ctx.fillText(`${score}%`, baseX, y - 12);
    ctx.font = "700 16px Inter, sans-serif";
    ctx.fillText(launch.name, baseX, canvas.height - 24);
  });

  requestAnimationFrame(drawReadinessChart);
}

function renderBrief(brief) {
  elements.briefOutput.replaceChildren(
    card("Product", `${brief.product_name}: ${brief.tagline}`),
    card("Target user", brief.target_user),
    card("Launch angle", brief.launch_angle),
    card("Product Hunt hook", brief.product_hunt_hook),
    card("Checklist", brief.checklist),
    card("Risks", brief.risks)
  );
}

function card(title, value) {
  const article = document.createElement("article");
  const body = Array.isArray(value)
    ? `<ul>${value.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<p>${value}</p>`;
  article.innerHTML = `<strong>${title}</strong>${body}`;
  return article;
}

function render() {
  renderMetricCards();
  renderLaunchList();
  renderDetail();
}

async function refresh() {
  const [{ launches }, portfolio] = await Promise.all([
    api("/api/launches"),
    api("/api/portfolio")
  ]);
  state.launches = launches;
  state.metricCards = portfolio.metric_cards;
  state.selectedId ??= launches[0]?.id ?? null;
  render();
}

elements.quickAdd.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(elements.quickAdd);
  const name = form.get("name");
  const tagline = form.get("tagline");
  await api("/api/launches", {
    method: "POST",
    body: JSON.stringify({
      name,
      tagline,
      audience: "makers preparing a public launch",
      positioning: tagline,
      launch_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      channels: ["Product Hunt"],
      tasks: [{ title: "Write launch story", owner: "founder", status: "todo" }]
    })
  });
  elements.quickAdd.reset();
  await refresh();
});

elements.briefForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = elements.briefForm.querySelector("button");
  button.disabled = true;
  elements.briefSource.textContent = "working";
  elements.briefOutput.textContent = "Generating launch brief...";

  try {
    const form = new FormData(elements.briefForm);
    const payload = await api("/api/brief", {
      method: "POST",
      body: JSON.stringify({
        idea: form.get("idea"),
        audience: "startup founders and product teams",
        channels: ["Product Hunt", "founder newsletter", "maker communities"]
      })
    });
    elements.briefSource.textContent = payload.source;
    renderBrief(payload.brief);
  } catch (error) {
    elements.briefSource.textContent = "error";
    elements.briefOutput.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

await refresh();
drawReadinessChart();
