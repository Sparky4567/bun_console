import index from "./index.html";
import { listGames, startGame, stopGame, shutdown } from "./runtime";
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT || 3000),
  routes: {
    "/api/games": { GET: async () => Response.json(await listGames()) },
    "/api/games/:id/:action": { POST: async req => {
      if (req.headers.get("origin") !== new URL(req.url).origin) return new Response("Forbidden origin", { status: 403 });
      try {
        const { id, action } = req.params;
        if (action === "start") await startGame(id);
        else if (action === "stop") await stopGame(id);
        else return new Response("Unknown action", { status: 404 });
        return Response.json({ ok: true });
      } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Operation failed" }, { status: 400 }); }
    } },
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => { shutdown(); server.stop(true); process.exit(0); });
process.on("exit", shutdown);
console.log(`Game console: ${server.url}`);
