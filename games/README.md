# Games

Put one Bun + React project per subfolder. Projects need a `package.json` with a `dev` or `start` script and must respect the assigned `PORT`/`BUN_PORT`. Install each project's dependencies with `bun install` before launching it.

Prebuilt games are also supported: place the build in `<game>/dist/index.html` with its assets. No additional manifest is required. The console discovers folders automatically.

See the root README for runtime behavior and configuration.
