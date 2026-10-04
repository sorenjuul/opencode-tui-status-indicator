// Root TUI entrypoint.
//
// OpenCode v2 resolves the CLI side of a local directory package via
// `<dir>/tui.{ts,js}`, mirroring the server `index.{ts,js}` convention, so
// this shim re-exports the built TUI entrypoint. See `src/tui.ts`.
export { default } from "./dist/tui.js";
