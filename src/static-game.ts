import { resolve, sep, extname } from "node:path";
import { realpath } from "node:fs/promises";
const root = await realpath(resolve(process.argv[2]!, "dist"));
Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT),
  async fetch(req) {
    try {
      const pathname = decodeURIComponent(new URL(req.url).pathname);
      const target = resolve(root, `.${pathname}`);
      if (target !== root && !target.startsWith(root + sep)) return new Response("Forbidden", { status: 403 });
      let path = target;
      if (!extname(path)) path = resolve(root, "index.html");
      const actual = await realpath(path);
      if (!actual.startsWith(root + sep)) return new Response("Forbidden", { status: 403 });
      return new Response(Bun.file(actual));
    } catch { return new Response("Not found", { status: 404 }); }
  },
});
