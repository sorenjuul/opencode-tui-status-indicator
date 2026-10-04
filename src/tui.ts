import { Plugin } from "@opencode/plugin/tui";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL = 120;
const ROUTE_POLL_INTERVAL = 500;
const DEFAULT_TITLE = "opencode";

type Status = "busy" | "idle" | "error" | "permission";

export default Plugin.define({
  id: "opencode-tui-status-indicator",
  setup(context) {
    const { renderer, data } = context;

    let title = DEFAULT_TITLE;
    let currentStatus: Status = "idle";
    let spinnerIndex = 0;
    let spinnerTimer: ReturnType<typeof setInterval> | null = null;
    let routeTimer: ReturnType<typeof setInterval> | null = null;
    let lastRouteKey: string | undefined;

    function currentSessionID(): string | undefined {
      try {
        const route = context.ui.router.current();
        if (route.type === "session") return route.sessionID;
        return undefined;
      } catch {
        return undefined;
      }
    }

    function currentRouteKey(): string {
      try {
        const route = context.ui.router.current();
        if (route.type === "session") return `session:${route.sessionID}`;
        return route.type;
      } catch {
        return "unknown";
      }
    }

    function resolveTitle(sessionID?: string): string {
      const id = sessionID ?? currentSessionID();
      if (id) {
        const session = data.session.get(id);
        if (session?.title) return session.title;
        return DEFAULT_TITLE;
      }
      return DEFAULT_TITLE;
    }

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

    function setStatus(status: Status, sessionID?: string) {
      if (sessionID) title = resolveTitle(sessionID);
      currentStatus = status;
      if (status === "busy") startSpinner();
      else stopSpinner();
    }

    const unsubscribes = [
      data.on("session.status", (event) => {
        const status = event.data.status;
        if (!status) return;
        if (status.type === "busy" || status.type === "retry")
          setStatus("busy", event.data.sessionID);
        else if (status.type === "idle")
          setStatus("idle", event.data.sessionID);
      }),

      data.on("session.execution.started", (event) =>
        setStatus("busy", event.data.sessionID),
      ),
      data.on("session.execution.succeeded", (event) =>
        setStatus("idle", event.data.sessionID),
      ),
      data.on("session.execution.failed", (event) =>
        setStatus("error", event.data.sessionID),
      ),
      data.on("session.execution.interrupted", (event) =>
        setStatus("idle", event.data.sessionID),
      ),
      data.on("session.idle", (event) =>
        setStatus("idle", event.data.sessionID),
      ),

      data.on("permission.asked", (event) =>
        setStatus("permission", event.data.sessionID),
      ),
      data.on("permission.replied", (event) =>
        setStatus("busy", event.data.sessionID),
      ),

      // V1 "question.*" events are V2 forms.
      data.on("form.created", (event) =>
        setStatus("permission", event.data.form.sessionID),
      ),
      data.on("form.replied", (event) =>
        setStatus("busy", event.data.sessionID),
      ),
      data.on("form.cancelled", (event) =>
        setStatus("idle", event.data.sessionID),
      ),

      data.on("session.created", (event) => {
        if (event.data.title) {
          title = event.data.title;
          renderTitle();
        } else {
          title = resolveTitle(event.data.sessionID);
          renderTitle();
        }
      }),

      data.on("session.renamed", (event) => {
        title = event.data.title;
        renderTitle();
      }),
    ];

    // Sync initial title from the active session, if any.
    // resolveTitle() is fallible-safe: router/storage may not be ready yet.
    title = resolveTitle();
    lastRouteKey = currentRouteKey();
    renderTitle();

    // The router has no change subscription, so poll for navigation
    // (home, tab switch) that emits no session event. Without this the
    // title keeps showing the previous session once the built-in
    // `OC | …` title is disabled.
    routeTimer = setInterval(() => {
      const key = currentRouteKey();
      if (key === lastRouteKey) return;
      lastRouteKey = key;
      title = resolveTitle();
      renderTitle();
    }, ROUTE_POLL_INTERVAL);

    return () => {
      for (const stop of unsubscribes) stop();
      if (spinnerTimer) clearInterval(spinnerTimer);
      spinnerTimer = null;
      if (routeTimer) clearInterval(routeTimer);
      routeTimer = null;
      renderer.setTerminalTitle("");
    };
  },
});
