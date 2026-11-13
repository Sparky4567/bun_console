# Bun Console

A local game library and process manager for independent Bun + React applications. Discover projects in `games/`, launch multiple apps on separate ports, inspect their logs, and play inside the console or in a new tab. Includes **Pulse**, a small reaction game.

## Run

```sh
bun install
bun dev
```

Open **http://127.0.0.1:3000**. For a console without development reloads, run `bun start`. Set `PORT` to change the console port: `PORT=4000 bun start`.

## Add your games

Place each normal project in its own immediate subfolder:

```text
games/
  pulse/
    package.json
    src/
  my-game/
    package.json
    src/
```

No console-specific manifest, model, or registration is needed. The console uses `name` and `description` from `package.json`, falling back to the folder name. It runs `bun run dev`, or `bun run start` when no dev script exists. Folders without a valid package or script appear with a helpful error. Discovery refreshes every two seconds.

The console supplies `PORT`, `BUN_PORT`, `HOST`, and `HOSTNAME`. Each game's server **must respect `PORT`** rather than hardcoding a port. A typical Bun entry point is:

```ts
import page from "./index.html";

Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT || 3001),
  routes: { "/*": page },
  development: process.env.NODE_ENV !== "production",
});
```

Each game runs from its own folder and serves from its own origin, so absolute asset paths, routing, API endpoints, and Bun hot reload work normally. The console waits up to 20 seconds for an HTTP response before marking a launch unsuccessful. Apps that forbid iframe embedding can be opened in a new tab.

Install any game-specific dependencies from that game's directory with `bun install`. Games may also resolve shared dependencies such as React from the console's root `node_modules`; the included Pulse example uses this, without duplicating dependencies. The launcher does not automatically install packages or modify projects.

## Runtime behavior

- Multiple games can run at once. Returning to the library keeps them running; **Stop runtime** ends a game.
- Recent stdout/stderr are bounded in memory and shown in the inspector.
- Console shutdown stops game process groups on macOS/Linux. On Windows, only the direct child is terminated; full descendant cleanup is not guaranteed.
- `bun dev` watches the console source. A console restart stops its games; game edits are handled by each game's own dev script.
- Runtime state resets when the console restarts.

This is a local runner for trusted projects: game scripts execute with your user's filesystem and environment access. It is not a sandbox. The console binds to loopback and checks Host and Origin for process-control requests. Keep it local. Each game's server should also bind to loopback.

## Checks

```sh
bun run typecheck
bun test
bun run build
```

Tests exercise folder discovery, invalid projects, concurrent launches, duplicate launch requests, logs, stopping, restarting, and failed launches. Runtime tests require permission to bind local TCP ports.

`bun run build` produces frontend assets in `dist/`. The process manager still requires the Bun server (`bun start`); static hosting alone cannot launch local applications.
# bun_console
# bun_console
