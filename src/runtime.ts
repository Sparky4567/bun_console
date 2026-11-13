import { readdir, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dir, "../games");
type Running = { process: Bun.Subprocess; port: number; status: string; logs: string; url: string };
const running = new Map<string, Running>();
const pending = new Set<string>();

async function folder(id: string) {
  if (!id || id.startsWith(".") || /[/\\]/.test(id)) throw new Error("Invalid game folder");
  const path = await realpath(resolve(root, id));
  if (!path.startsWith((await realpath(root)) + sep)) throw new Error("Game must be inside games/");
  return path;
}
async function describe(id: string) {
  const path = await folder(id);
  const file = Bun.file(resolve(path, "package.json"));
  const pkg = await file.exists() ? await file.json() : {};
  const script = pkg.scripts?.dev ? "dev" : pkg.scripts?.start ? "start" : null;
  const built = await Bun.file(resolve(path, "dist/index.html")).exists();
  const state = running.get(id);
  return { id, name: id.replace(/[-_]/g, " "), packageName: pkg.name, mode: script ? "Bun project" : built ? "Built game" : "Unavailable", runnable: Boolean(script || built), status: pending.has(id) ? "starting" : state?.status ?? "stopped", url: state?.status === "running" ? state.url : null, logs: state?.logs ?? "", script };
}
export async function listGames() {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.filter(e => e.isDirectory() && !e.name.startsWith(".")).map(async e => {
    try { return await describe(e.name); } catch { return null; }
  }))).filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name));
}
export async function stopGame(id: string) {
  await folder(id);
  const state = running.get(id);
  if (state && state.process.exitCode === null) {
    state.status = "stopping";
    // Detached process groups also include script runners and their children.
    try { process.kill(-state.process.pid, "SIGTERM"); } catch { state.process.kill(); }
    await Promise.race([state.process.exited, Bun.sleep(1500)]);
    if (state.process.exitCode === null) {
      try { process.kill(-state.process.pid, "SIGKILL"); } catch { state.process.kill(9); }
      await state.process.exited;
    }
  }
  if (state) state.status = "stopped";
}
export async function startGame(id: string) {
  if (pending.has(id) || running.get(id)?.status === "running") return;
  pending.add(id);
  try {
    const game = await describe(id);
    if (!game.runnable) throw new Error("Add a package.json with a dev/start script, or dist/index.html");
    const path = await folder(id);
    // Ask the OS for a free port; the child binds it immediately afterward.
    const probe = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
    const port = probe.port!;
    probe.stop(true);
    const child = Bun.spawn(game.script ? [process.execPath, "run", game.script] : [process.execPath, resolve(import.meta.dir, "static-game.ts"), path], {
      cwd: path, env: { ...process.env, PORT: String(port), BUN_PORT: String(port), HOST: "127.0.0.1", NODE_ENV: "development" },
      stdout: "pipe", stderr: "pipe", detached: true,
    });
    const state: Running = { process: child, port, status: "starting", logs: "", url: `http://127.0.0.1:${port}` };
    running.set(id, state);
    async function read(stream: ReadableStream<Uint8Array>) {
      const decoder = new TextDecoder();
      for await (const chunk of stream) state.logs = (state.logs + decoder.decode(chunk, { stream: true })).slice(-24000);
    }
    void read(child.stdout as ReadableStream<Uint8Array>);
    void read(child.stderr as ReadableStream<Uint8Array>);
    void child.exited.then(code => { if (state.status !== "stopping" && state.status !== "stopped") state.status = code === 0 ? "stopped" : "error"; });
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`Game exited (${child.exitCode}). Check its logs.`);
      try {
        await fetch(state.url, { signal: AbortSignal.timeout(500) });
        state.status = "running";
        return;
      } catch { await Bun.sleep(100); }
    }
    await stopGame(id);
    state.status = "error";
    throw new Error("Startup timed out. The game's server must listen on process.env.PORT or BUN_PORT.");
  } finally { pending.delete(id); }
}
export function shutdown() {
  for (const state of running.values()) {
    try { process.kill(-state.process.pid, "SIGTERM"); } catch { state.process.kill(); }
  }
}
