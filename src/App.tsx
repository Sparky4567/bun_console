import { useEffect, useState } from "react";
import "./index.css";
type Game = { id: string; name: string; mode: string; runnable: boolean; status: string; url: string | null; logs: string };
export function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState(false);
  async function refresh() {
    const res = await fetch("/api/games");
    if (!res.ok) throw new Error("Could not read games folder");
    setGames(await res.json());
  }
  useEffect(() => {
    const load = () => refresh().catch(e => setError(e.message));
    load(); const timer = setInterval(load, 2000); return () => clearInterval(timer);
  }, []);
  const game = games.find(g => g.id === selected) ?? games[0];
  async function action(kind: "start" | "stop") {
    if (!game) return;
    setBusy(game.id); setError("");
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(game.id)}/${kind}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refresh(); setPlaying(kind === "start");
    } catch (e) { setError(e instanceof Error ? e.message : "Operation failed"); }
    finally { setBusy(null); }
  }
  return <div className="console">
    <aside><a className="brand" href="/">▧ <span>arcade<span className="brand-dot">.</span></span></a><div className="nav-label">YOUR SPACE</div><div className="nav-active">▦ &nbsp; Game library <span>{games.length}</span></div><div className="sidebar-bottom"><i /> LOCAL RUNTIME<br/><small>Powered by Bun + React</small></div></aside>
    <main><header><span>WORKSPACE <b>/</b> LIBRARY</span><div className="local"><i /> Local console</div></header>
      <section className="heading"><div className="eyebrow">GOOD TIMES, LOCALLY HOSTED</div><h1>Your next session<br/>starts here<span>.</span></h1><p>A home for your games. Pick one and press play.</p></section>
      <div className="library-bar"><h2>Game library <span>{games.length.toString().padStart(2, "0")}</span></h2><input aria-label="Search games" placeholder="Search your library…" value={search} onChange={e => setSearch(e.target.value)}/></div>
      {error && <div className="error" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
      <div className="cards">{games.filter(g => g.name.includes(search.toLowerCase())).map((g, n) => <button key={g.id} className={`card theme-${n % 3} ${game?.id === g.id ? "selected" : ""}`} onClick={() => { setSelected(g.id); setPlaying(false); }}><div className="art"><span className="number">0{n + 1} / LOCAL GAME</span><span className="game-symbol">{["♜", "◈", "✈"][n % 3]}</span><span className={`badge ${g.status}`}>{g.status}</span></div><div className="card-info"><h3>{g.name}</h3><span>{g.mode}</span><b>↗</b></div></button>)}</div>
      {!games.length && <p className="empty">Add a Bun project or a built game to games/ to get started.</p>}
      {game && <section className="detail"><div className="detail-title"><div><div className="eyebrow">SELECTED GAME</div><h2>{game.name}</h2><p>games/{game.id} <span>· {game.mode}</span></p></div><div className="actions">{game.status === "running" ? <><button className="secondary" disabled={Boolean(busy)} onClick={() => action("stop")}>Stop game</button><button className="primary" onClick={() => setPlaying(!playing)}>{playing ? "Hide player" : "▶ Play game"}</button><a href={game.url!} target="_blank" rel="noreferrer" aria-label="Open game in new tab">↗</a></> : <button className="primary" disabled={!game.runnable || Boolean(busy) || game.status === "starting"} onClick={() => action("start")}>{busy === game.id || game.status === "starting" ? "Starting…" : "▶ Launch game"}</button>}</div></div>
      {playing && game.url && <iframe title={game.name} src={game.url} allow="fullscreen; gamepad; autoplay" allowFullScreen/>}
      <details><summary>Runtime output <span>{game.status}</span></summary><pre>{game.logs || "Ready when you are. Launch the game to see its output here."}</pre></details></section>}
      <footer><span><i /> All systems local</span><span>Drop a project into <code>games/</code>. We’ll take it from there.</span></footer>
    </main>
  </div>;
}
export default App;
