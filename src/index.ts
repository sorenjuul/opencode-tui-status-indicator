import type { TuiPlugin } from "@opencode-ai/plugin/tui";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL = 120;

type Status = "busy" | "idle" | "error" | "permission";

const tuiPlugin: TuiPlugin = async (api) => {
  const { renderer, event, lifecycle } = api;

  let title = "opencode";
  let currentStatus: Status = "idle";
  let spinnerIndex = 0;
  let spinnerTimer: ReturnType<typeof setInterval> | null = null;

  function renderTitle() {
    const truncated =
      title.length > 40 ? title.slice(0, 37) + "..." : title;
    switch (currentStatus) {
      case "busy":
        renderer.setTerminalTitle(
          `${SPINNER_FRAMES[spinnerIndex]} ${truncated}`,
        );
        break;
      case "idle":
        renderer.setTerminalTitle(`✓ ${truncated}`);
        break;
      case "error":
        renderer.setTerminalTitle(`✗ ${truncated}`);
        break;
      case "permission":
        renderer.setTerminalTitle(`◉ ${truncated}`);
        break;
    }
  }

  function startSpinner() {
    if (spinnerTimer) return;
    spinnerIndex = 0;
    spinnerTimer = setInterval(() => {
      spinnerIndex = (spinnerIndex + 1) % SPINNER_FRAMES.length;
      renderTitle();
    }, SPINNER_INTERVAL);
    renderTitle();
  }

  function stopSpinner() {
    if (spinnerTimer) {
      clearInterval(spinnerTimer);
      spinnerTimer = null;
    }
    renderTitle();
  }

  function setStatus(status: Status) {
    currentStatus = status;
    if (status === "busy") startSpinner();
    else stopSpinner();
  }

  event.on("session.status" as any, (e: any) => {
    const status = e?.properties?.status;
    if (!status) return;
    if (status.type === "busy" || status.type === "retry") setStatus("busy");
    else if (status.type === "idle") setStatus("idle");
  });

  event.on("session.idle" as any, () => setStatus("idle"));
  event.on("session.error" as any, () => setStatus("error"));
  event.on("permission.asked" as any, () => setStatus("permission"));
  event.on("permission.replied" as any, () => setStatus("busy"));
  event.on("question.asked" as any, () => setStatus("permission"));
  event.on("question.replied" as any, () => setStatus("busy"));
  event.on("question.rejected" as any, () => setStatus("idle"));

  event.on("session.created" as any, (e: any) => {
    if (e?.properties?.info?.title) title = e.properties.info.title;
  });

  event.on("session.updated" as any, (e: any) => {
    if (e?.properties?.info?.title) {
      title = e.properties.info.title;
      renderTitle();
    }
  });

  lifecycle.onDispose(() => {
    if (spinnerTimer) clearInterval(spinnerTimer);
    renderer.setTerminalTitle("");
  });
};

export default { id: "opencode-tui-status-indicator", tui: tuiPlugin };
