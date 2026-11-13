# Arcade — Bun game console

A local React console that discovers the immediate subfolders of `games/`, launches independent Bun apps, and provides an embedded player, a separate-tab link, status, and recent stdout/stderr output. Several games can run simultaneously. The library refreshes every two seconds.

## Requirements

- Bun 1.4.4 or newer (the version used to verify this project).
- Linux or macOS for process-group shutdown support.
- A modern browser.

## Run

```sh
git clone https://github.com/Sparky4567/bun_console.git
cd bun_console
bun install
cd games/gold_digger
bun install
cd ../..
bun dev
```

Open http://127.0.0.1:3000. To choose another console port: `PORT=4000 bun dev`.

```sh
bun run typecheck
bun test
bun run build
bun start
```

`bun start` runs the console in production mode using Bun's HTML bundler. The standalone `dist/` build contains the frontend only; the Bun server is still required for discovery and process management. Frontend HMR is enabled in development; restart the console after changing backend code.

## Included games

| Folder | Runtime |
| --- | --- |
| `games/fort-defense` | Prebuilt game served from `dist/` |
| `games/gold_digger` | Bun + React source project |
| `games/jet_flight` | Prebuilt game served from `dist/` |

## Add games

Place each project in its own directory:

```text
games/
  my-game/
    package.json
    src/
  built-game/
    dist/
      index.html
      ...assets
```

No custom manifest, plugin, or changes to React components are needed.

For source projects, install dependencies in that project's folder with `bun install`. The console runs its `dev` script, falling back to `start`, from the game's directory. A source project's script takes precedence over its `dist/` build. Dependencies are not installed automatically.

Each process receives a free port in `PORT` and `BUN_PORT`, plus `HOST=127.0.0.1`. Standard Bun servers that omit `port` use `BUN_PORT` automatically. For an explicitly configured server use:

```ts
Bun.serve({
  hostname: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT || 3000),
  // your existing routes/fetch handler
});
```

Servers must honor the assigned port and serve HTTP at `/`; hardcoded ports need updating. A game is marked running once it responds to HTTP. Startup times out after approximately 10–60 seconds depending on connection attempts. Projects should keep their server process in the foreground. Logs retain the latest 24,000 characters per game.

Folders with only `dist/index.html` run through a lightweight static Bun server, including an SPA fallback for extensionless URLs. Built assets should use relative or root-relative paths. Folder names become display titles automatically. Hidden folders and symlinks outside `games/` are ignored.

Use **Launch game**, then play inside the console or open the game in a separate tab. **Stop game** ends its process group on Linux/macOS. Exiting the console with Ctrl+C also terminates running games. Windows process-tree cleanup is best effort.

This is a local runner for trusted projects: launching a game executes its package script with your user permissions and environment. It is not a sandbox or a public multi-user hosting platform. The console and built-game servers bind to loopback; source games control their own bind address. Each game uses a separate origin, so browser storage is separate from the console and may change when a game restarts on another port.

## License

[MIT](LICENSE) © 2026 Sparky4567.
