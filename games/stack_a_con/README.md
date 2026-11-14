# Stackyard — Apartment Edition

A cartoon construction game: build a sunny 20-floor apartment house, one room at a time. Made with React, TypeScript, and Bun, with the crane, rooms, and scenery drawn in SVG.

## Getting started

Install [Bun](https://bun.sh), then run:

```sh
bun install
bun run dev
```

Open the local URL printed by Bun. The development server supports hot reloading.

## How to play

- Press **Space**, click **Place room**, or **tap the scene** to release an apartment section.
- Follow the projected landing guide. The crane stays close to the top floor for easier aiming.
- Align each room with the floor below. Off-center landings narrow your building; three misses end construction.
- Complete **20 floors** to finish the apartment house and add its roof.
- Press **P** or **Escape** to pause or resume. Use the restart button to begin again.
- Enable optional sound with the speaker button. Your personal best is saved in this browser.

Each floor earns **100 points**. Perfect alignment adds a growing bonus, up to **250 extra points**. Three or more consecutive perfect placements restore some floor width. Movement gradually speeds up, with wind arriving after eight floors.

## Build and check

```sh
# Create an optimized browser build in dist/
bun run build

# Check TypeScript
bunx tsc --noEmit

# Run the Bun server in production mode
bun run start
```

The production server serves and bundles `src/index.html` through Bun's HTML import support. The separate build command produces static files in `dist/` for static hosting.

## Project structure

- `src/App.tsx` — game loop, controls, scoring, and SVG scene.
- `src/index.css` — visual styling and responsive layout.
- `src/index.html` — page entry and metadata.
- `src/frontend.tsx` — React entry point.
- `src/index.ts` — Bun web server.

## License

[MIT](LICENSE) — Copyright (c) 2026 Stackyard contributors.
# build_a_compartment
