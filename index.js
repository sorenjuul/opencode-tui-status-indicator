// Root server entrypoint.
//
// OpenCode v2 resolves local directory packages via `<dir>/index.{ts,js}`
// (package.json `main`/`exports` are not consulted on this path), so this
// shim re-exports the built server entrypoint. See `src/index.ts`.
export { default } from "./dist/index.js";
