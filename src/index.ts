import { Plugin } from "@opencode/plugin";

// Server entrypoint (required alongside ./tui).
// This plugin is TUI-only: all behavior lives in src/tui.ts.
export default Plugin.define({
  id: "opencode-tui-status-indicator",
  async setup() {},
});
