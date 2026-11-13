import { expect, test } from "bun:test";
import { listGames, startGame, stopGame } from "./runtime";

test("discovers both source projects and built games", async () => {
  const games = await listGames();
  expect(games.find(g => g?.id === "gold_digger")?.mode).toBe("Bun project");
  expect(games.find(g => g?.id === "fort-defense")?.mode).toBe("Built game");
  expect(games.every(g => !g?.id.startsWith("."))).toBe(true);
});

test("rejects path traversal before starting or stopping a process", async () => {
  for (const id of ["..", "../src", "foo/bar", "foo\\bar", ".hidden"]) {
    await expect(startGame(id)).rejects.toThrow("Invalid game folder");
    await expect(stopGame(id)).rejects.toThrow("Invalid game folder");
  }
});
