import { useEffect, useRef, useState } from "react";
import "./index.css";

type Block = { x: number; y: number; w: number; color: number; label: string };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
type Game = { blocks: Block[]; active: Block; phase: 'swing' | 'fall' | 'over' | 'complete'; time: number; velocity: number; score: number; lives: number; combo: number; perfect: number; camera: number; particles: Particle[]; message: string; messageTime: number; paused: boolean; started: boolean };
const colors = ['#ed845c', '#73a49c', '#edbe53', '#858ab5', '#d99baf'];
const labels = ['THE SUNROOM', 'COZY CORNER', 'GARDEN SUITE', 'SKY STUDIO', 'HAPPY PLACE'];
const FLOOR_GOAL = 20;
const ROOM_WIDTH = 180;
const landingY = (g: Game) => (g.blocks.at(-1)?.y ?? 550) - 48;
const hangingY = (g: Game) => landingY(g) - 108;
const initial = (): Game => ({ blocks: [], active: { x: 410, y: 394, w: ROOM_WIDTH, color: 0, label: labels[0]! }, phase: 'swing', time: 0, velocity: 0, score: 0, lives: 3, combo: 0, perfect: 0, camera: 0, particles: [], message: 'Build a 20-floor apartment house. One room at a time.', messageTime: 3, paused: false, started: false });
function Room({ block, hanging = false, floor = 0 }: { block: Block; hanging?: boolean; floor?: number }) {
  const { x, y, w, color } = block;
  const windows = Math.max(1, Math.floor((w - 16) / 38));
  return <g transform={`translate(${x} ${y})`}>
    <rect x="3" y="4" width={w} height="48" rx="2" fill="#253b36" opacity=".12" />
    <rect width={w} height="48" rx="2" fill={colors[color % colors.length]} stroke="#566551" strokeWidth="1.5" />
    <rect x="1" y="1" width={w - 2} height="5" fill="#fff1ce" />
    <path d={`M0 47H${w}`} stroke="#64715b" strokeWidth="3" />
    {Array.from({ length: windows }, (_, i) => {
      const wx = (w - windows * 32) / 2 + i * 32 + 5;
      return <g key={i}>
        <rect x={wx} y="12" width="22" height="25" rx="2" fill={(floor + i) % 3 === 0 ? '#ffe8a1' : '#beded8'} stroke="#536f65" strokeWidth="2" />
        <path d={`M${wx + 11} 13v23M${wx} 24h22`} stroke="#fff7de" strokeWidth="2" />
        <path d={`M${wx - 2} 39h26`} stroke="#fff0cb" strokeWidth="3" />
        {(floor + i) % 4 === 1 && <g><rect x={wx + 14} y="32" width="8" height="5" rx="1" fill="#bc7756" /><path d={`M${wx + 18} 32v-8m0 5q-7-7-5-8m5 6q7-6 6-8`} stroke="#58845e" strokeWidth="2" fill="none" /></g>}
      </g>;
    })}
    {w > 100 && <><rect x="5" y="17" width="14" height="14" rx="2" fill="#fff6de" /><text x="12" y="27" textAnchor="middle" fill="#62705b" fontSize="8" fontWeight="700">{floor + 1}</text></>}
    {hanging && <path d={`M8 0L${w / 2} -29L${w - 8} 0`} fill="none" stroke="#42564b" strokeWidth="2" />}
  </g>;
}
function Icon({ type }: { type: 'sound' | 'pause' | 'restart' }) { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{type === 'sound' ? <><path d="M11 4L5 9H2v6h3l6 5zM15 8q5 4 0 8M18 4q9 8 0 16" /></> : type === 'pause' ? <><path d="M8 5v14M16 5v14" /></> : <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>}</svg> }
export function App() {
  const game = useRef<Game>(initial());
  const [view, setView] = useState<Game>({ ...game.current });
  const [best, setBest] = useState(() => { try { return Number(localStorage.getItem('stackyard-best')) || 0; } catch { return 0; } });
  const [sound, setSound] = useState(false);
  const soundRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const chime = (perfect: boolean) => {
    if (!soundRef.current) return;
    try { const ctx = audioRef.current ??= new AudioContext(); void ctx.resume(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; osc.frequency.setValueAtTime(perfect ? 740 : 330, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(perfect ? 1100 : 220, ctx.currentTime + .13); gain.gain.setValueAtTime(.12, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .25); osc.start(); osc.stop(ctx.currentTime + .26); } catch {} 
  };
  const drop = () => { const g = game.current; if (g.paused || g.phase !== 'swing') return; g.started = true; g.phase = 'fall'; g.velocity = 30; };
  const restart = () => { game.current = initial(); setView({ ...game.current }); };
  const pause = () => { const g = game.current; if (g.phase !== 'over' && g.phase !== 'complete') { g.paused = !g.paused; setView({ ...g }); } };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.target as HTMLElement).closest('button')) return; if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) { if ((game.current.phase === 'over' || game.current.phase === 'complete')) restart(); else drop(); } } if (e.code === 'KeyP' || e.code === 'Escape') pause(); };
    const onBlur = () => { if (game.current.started && game.current.phase !== 'over' && game.current.phase !== 'complete') game.current.paused = true; };
    window.addEventListener('keydown', onKey); window.addEventListener('blur', onBlur);
    let frame = 0; let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, .04); last = now; const g = game.current;
      if (!g.paused && g.phase !== 'over' && g.phase !== 'complete') {
        g.time += dt; g.messageTime = Math.max(0, g.messageTime - dt);
        const targetCamera = Math.max(0, g.blocks.length * 48 - 144); g.camera += (targetCamera - g.camera) * Math.min(1, dt * 5);
        if (g.phase === 'swing') {
          const speed = .75 + Math.min(g.blocks.length * .035, .85);
          const wind = g.blocks.length >= 8 ? Math.sin(g.time * 2.9) * Math.min(35, g.blocks.length) : 0;
          g.active.x = (g.blocks.at(-1)?.x ?? 410) + Math.sin(g.time * speed) * 165 + wind;
          g.active.y = hangingY(g) + Math.cos(g.time * speed * 2) * 3;
        } else {
          g.velocity += 1550 * dt; g.active.y += g.velocity * dt;
          const top = g.blocks[g.blocks.length - 1]; const landing = landingY(g);
          if (g.active.y >= landing) {
            const left = Math.max(g.active.x, top?.x ?? 395); const right = Math.min(g.active.x + g.active.w, top ? top.x + top.w : 605);
            const overlap = right - left; const perfect = Math.abs(g.active.x - (top?.x ?? 410)) < 14;
            if (overlap < 40) {
              g.lives--; g.combo = 0; g.message = g.lives ? 'Missed the foundation! Try the next room.' : 'Construction paused. Time for a fresh blueprint.'; g.messageTime = 2.6; chime(false);
              for (let i = 0; i < 16; i++) g.particles.push({ x: g.active.x + g.active.w / 2, y: landing + 45, vx: (Math.random() - .5) * 220, vy: -Math.random() * 190, life: 1, color: '#b4dfdc' });
              if (!g.lives) g.phase = 'over';
            } else {
              g.combo = perfect ? g.combo + 1 : 0; if (perfect) g.perfect++;
              const bonus = perfect ? 50 * Math.min(g.combo, 5) : 0; g.score += 100 + bonus;
              g.active.y = landing;
              g.active.x = perfect ? (top?.x ?? 410) : left;
              g.active.w = perfect ? Math.min(ROOM_WIDTH, (top?.w ?? ROOM_WIDTH) + (g.combo >= 3 ? 12 : 0)) : Math.min(overlap, g.active.w);
              g.blocks.push({ ...g.active }); chime(perfect);
              g.message = perfect ? g.combo >= 3 ? `PERFECT ×${g.combo} · Floor expanded! +${100 + bonus}` : `PERFECT! +${100 + bonus}` : ['Room installed! +100', 'Another home in the sky! +100', 'Looking good, builder. +100'][g.blocks.length % 3]!; g.messageTime = 1.7;
              if (perfect) for (let i = 0; i < 22; i++) g.particles.push({ x: g.active.x + g.active.w / 2, y: landing, vx: (Math.random() - .5) * 240, vy: -90 - Math.random() * 150, life: 1.1, color: ['#f5ca60', '#f7f5df', '#ed845c'][i % 3]! });
            }
            if (g.blocks.length >= FLOOR_GOAL) { g.phase = 'complete'; g.message = 'Welcome home!'; }
            if (g.phase !== 'over' && g.phase !== 'complete') { g.phase = 'swing'; g.velocity = 0; g.active = { x: g.blocks.at(-1)?.x ?? 410, y: hangingY(g), w: g.blocks.at(-1)?.w ?? ROOM_WIDTH, color: g.blocks.length % 5, label: labels[g.blocks.length % 5]! }; }
          }
        }
      }
      if (!g.paused) g.particles = g.particles.filter(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; return p.life > 0; });
      setView({ ...g, blocks: [...g.blocks], particles: [...g.particles], active: { ...g.active } }); frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', onKey); window.removeEventListener('blur', onBlur); };
  }, []);
  useEffect(() => { if (view.score > best) { setBest(view.score); try { localStorage.setItem('stackyard-best', String(view.score)); } catch {} } }, [view.score, best]);
  const landing = landingY(view);
  const craneY = landing + view.camera - 208;
  const level = Math.floor(view.blocks.length / 5) + 1;
  return <div className="app">
    <header><a className="brand" href="./" aria-label="Stackyard home"><span className="brand-icon">▥</span> stackyard<span className="brand-dot">®</span></a><div className="header-tag">A LITTLE BALANCE. A LOT OF AMBITION.</div><span className="edition"><span /> THE APARTMENT EDITION</span></header>
    <main><div className="intro"><div><div className="eyebrow"><span /> CLOCK IN. STACK UP.</div><h1>The sky’s the limit<span>.</span></h1><p>Build a happy little apartment house. One room at a time.</p></div><div className="personal-best"><span className="trophy">♜</span><div><small>PERSONAL BEST</small><strong>{best.toLocaleString()} <span>PTS</span></strong></div></div></div>
      <div className="game-layout"><section className="game-card" aria-label="Apartment building game">
        <div className="game-hud"><div className="level"><span className="live-dot" /> LEVEL {String(level).padStart(2, '0')}<span className="hud-divider" /><span>{view.blocks.length >= 8 ? 'BREEZY HEIGHTS' : 'EASY DOES IT'}</span></div><div className="game-tools"><button onClick={() => { soundRef.current = !sound; setSound(!sound); }} aria-label={sound ? 'Mute sound' : 'Enable sound'} title={sound ? 'Mute sound' : 'Enable sound'} className={!sound ? 'muted' : ''}><Icon type="sound" />{!sound && <span className="mute-slash" />}</button><button onClick={pause} aria-label={view.paused ? 'Resume game' : 'Pause game'} title="Pause (P)"><Icon type="pause" /></button><button onClick={restart} aria-label="Restart game" title="Restart"><Icon type="restart" /></button></div></div>
        <div className="scene" onPointerDown={e => { if (!(e.target as HTMLElement).closest('button')) drop(); }}>
        <svg viewBox="0 0 1000 650" role="img" aria-label={`Cartoon construction site. ${view.blocks.length} floors built. ${view.lives} chances left.`}>
          <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#d8ebe6" /><stop offset="1" stopColor="#f0f0d9" /></linearGradient><pattern id="hazard" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="9" height="18" fill="#344d42" /><rect x="9" width="9" height="18" fill="#edc65c" /></pattern></defs>
          <rect width="1000" height="650" fill="url(#sky)" />
          <circle cx="790" cy="140" r="53" fill="#f8db85" /><circle cx="790" cy="140" r="66" fill="#f8db85" opacity=".17" />
          <g fill="#fffdf0" opacity=".85"><path d="M98 149q-17-27 13-34 8-36 38-23 26-18 40 13 33-4 33 24H98z" /><path d="M660 216q-14-20 11-29 5-26 29-16 22-15 33 12 27-3 29 18H660z" /><path d="M325 229q-10-22 12-26 6-22 25-13 20-9 28 10 23 0 22 16H325z" /></g>
          <g stroke="#66847a" strokeWidth="2" fill="none" opacity=".6"><path d="M820 259q7-9 14 0 7-9 14 0M862 235q5-7 10 0 5-7 10 0" /></g>
          <g opacity=".2" fill="#74988c"><path d="M0 439h65v-40h53v40h30v-64h52v64h28v-28h85v28h53v78H0zM650 451h55v-42h46v42h26v-68h68v68h28v-26h76v26h51v66H650z" /><path d="M72 400V288h8v112M76 290h180v8H76M191 298v117h-4V298M729 411V315h6v96M732 315h127v6H732" /></g>
          <g transform={`translate(0 ${view.camera * .16})`} opacity={Math.max(0, 1 - view.camera / 1000)}>
            <rect y="550" width="1000" height="100" fill="#bdcba0" />
            <path d="M0 592h1000" stroke="#e5ddbd" strokeWidth="45" />
            {[280, 725, 925].map(x => <g key={x}><rect x={x - 4} y="500" width="8" height="51" fill="#897957" /><circle cx={x} cy="489" r="27" fill="#91ad7a" /><circle cx={x - 14} cy="499" r="19" fill="#9cb783" /></g>)}
          </g>
          <g transform={`translate(0 ${view.camera})`}>
            <rect x="385" y="550" width="230" height="15" rx="3" fill="#c4b797" stroke="#6f795e" strokeWidth="2" />
            <rect x="405" y="565" width="190" height="25" fill="#e7d7ad" stroke="#8d9478" />
            <path d="M481 589v-18h38v18" fill="#7a9f91" stroke="#617866" strokeWidth="2" />
            <text x="500" y="605" textAnchor="middle" fontSize="9" letterSpacing="2" fill="#68775b">SUNNY SIDE APARTMENTS</text>
            {view.blocks.map((block, i) => <Room key={i} block={block} floor={i} />)}
          </g>
          <g aria-label="Low construction crane">
            <rect x="110" y={craneY + 24} width="30" height={Math.max(380, 550 + view.camera - craneY - 24)} fill="#e9bd5c" stroke="#8d8855" strokeWidth="2" />
            {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M111 ${craneY + 30 + i * 38}l28 32m-28 0l28-32`} stroke="#a39457" strokeWidth="2" />)}
            <rect x="80" y={craneY} width="778" height="24" rx="3" fill="#edc562" stroke="#7c7849" strokeWidth="2" />
            <path d={`M92 ${craneY + 6}h750M92 ${craneY + 18}h750`} stroke="#ac9650" strokeDasharray="16 8" />
            <path d={`M125 ${craneY}v-48l240 48m-240-48L85 ${craneY}`} fill="none" stroke="#8a8451" strokeWidth="2" />
            <rect x="65" y={craneY - 5} width="42" height="34" rx="3" fill="#6b8070" stroke="#425a48" strokeWidth="2" />
            <rect x="140" y={craneY + 26} width="42" height="44" rx="4" fill="#e4bd5c" stroke="#7c7849" strokeWidth="2" />
            <rect x="148" y={craneY + 33} width="26" height="23" rx="2" fill="#a0c7bd" />
          </g>
          <g transform={`translate(0 ${view.camera})`}>
            {view.phase === 'swing' && <><path d={`M${view.active.x + view.active.w / 2} ${craneY + 24 - view.camera}V${view.active.y - 38}`} stroke="#4d6250" strokeWidth="2" /><rect x={view.active.x + view.active.w / 2 - 16} y={craneY + 14 - view.camera} width="32" height="15" rx="3" fill="#526b56" /><path d={`M${view.active.x + view.active.w / 2} ${view.active.y - 38}v5q12 10 0 13`} stroke="#435b47" strokeWidth="3" fill="none" /></>}
            {view.phase === 'swing' && <g opacity=".35"><rect x={view.active.x} y={landing} width={view.active.w} height="48" rx="2" fill="#fff8d5" stroke="#547b62" strokeWidth="2" strokeDasharray="5 5" /><path d={`M${view.active.x + view.active.w / 2} ${view.active.y + 52}V${landing}`} stroke="#5e8064" strokeDasharray="3 6" /></g>}
            {(view.phase === 'swing' || view.phase === 'fall') && <Room block={view.active} hanging={view.phase === 'swing'} floor={view.blocks.length} />}
            {view.phase === 'complete' && <g><path d={`M${view.blocks.at(-1)!.x - 8} ${view.blocks.at(-1)!.y}l${view.blocks.at(-1)!.w / 2 + 8}-30 ${view.blocks.at(-1)!.w / 2 + 8} 30z`} fill="#c67d62" stroke="#735f4b" strokeWidth="2" /><text x={view.blocks.at(-1)!.x + view.blocks.at(-1)!.w / 2} y={view.blocks.at(-1)!.y - 40} textAnchor="middle" fill="#47664b" fontSize="18">WELCOME HOME! ♡</text></g>}

            {view.particles.map((p, i) => <rect key={i} x={p.x} y={p.y} width="6" height="6" rx="1" fill={p.color} opacity={Math.min(1, p.life * 2)} transform={`rotate(${p.life * 180} ${p.x} ${p.y})`} />)}
          </g>
          {view.blocks.length > 0 && <g fill="#637e6b" fontSize="10" fontFamily="monospace"><path d="M645 303v240m-5 0h10m-10-240h10" stroke="#78927b" strokeDasharray="3 5" /><text x="657" y="429">{view.blocks.length * 3} m</text></g>}
          <g transform="translate(877 489)"><path d="M0 20l12-31L24 20z" fill="#ed845c" stroke="#855f44" strokeWidth="1.5" /><path d="M5 7h14" stroke="#fff5d9" strokeWidth="5" /><rect x="-4" y="19" width="32" height="5" rx="2" fill="#6a7659" /></g>
          <g transform="translate(830 505)"><ellipse cx="0" cy="6" rx="15" ry="4" fill="#7e9e89" opacity=".3" /><path d="M-7 0v-17h14V0" fill="#e8b958" /><circle cy="-25" r="8" fill="#dfb68a" /><path d="M-11-27q0-13 11-13t11 13z" fill="#edbf4e" /><path d="M-6 0v7m12-7v7" stroke="#4a624e" strokeWidth="4" /></g>
        </svg>
        {view.messageTime > 0 && !view.paused && view.phase !== 'over' && view.phase !== 'complete' && <div className={`floating-message ${view.message.startsWith('PERFECT') ? 'perfect' : ''}`} key={view.message}>{view.message}</div>}
        {(view.paused || view.phase === 'over' || view.phase === 'complete') && <div className="overlay"><div className="overlay-card"><span className="eyebrow">{view.paused ? 'TAKE A BREATHER' : view.phase === 'complete' ? 'BUILDING COMPLETE' : 'SHIFT COMPLETE'}</span><h2>{view.paused ? 'Holding steady.' : view.phase === 'complete' ? 'Welcome home!' : 'A fresh blueprint?'}</h2><p>{view.paused ? 'Your building can wait a little.' : `${view.blocks.length} floors · ${view.blocks.length * 3} meters · ${view.perfect} perfect drops`}</p>{!view.paused && <strong className="final-score">{view.score.toLocaleString()} <small>PTS</small></strong>}<button className="primary" onClick={view.paused ? pause : restart}>{view.paused ? 'Back to work' : 'Build another house'} <span>↗</span></button></div></div>}
        <div className="scene-caption"><span><i /> {view.blocks.length >= 8 ? 'A LITTLE WIND. A LITTLE COURAGE.' : 'CLEAR SKIES. GOOD VIBES.'}</span><span>SUNNY SIDE AVENUE</span></div>
        </div>
        <div className="control-bar"><div><span className="key-cap">SPACE</span><span>to place a room <span className="desktop-copy">· or tap the scene</span></span></div><button onClick={drop} disabled={view.phase !== 'swing' || view.paused}>PLACE ROOM <span>↓</span></button></div>
      </section>
      <aside><section className="score-card"><div className="eyebrow">YOUR SHIFT</div><div className="build-progress"><span>YOUR BUILDING</span><strong>{view.blocks.length} / {FLOOR_GOAL}</strong><progress aria-label="Building completion" value={view.blocks.length} max={FLOOR_GOAL} /></div><div className="score-label">TOTAL SCORE <span>↗</span></div><div className="score-value" aria-live="polite">{view.score.toLocaleString().padStart(4, '0')}<span>PTS</span></div><div className="stats"><div><small>FLOORS BUILT</small><strong>{view.blocks.length}<span> / 20 floors</span></strong></div><div><small>ALTITUDE</small><strong>{view.blocks.length * 3}<span> meters</span></strong></div></div><div className="chances"><div><small>CHANCES LEFT</small><span>{Array.from({ length: 3 }, (_, i) => <b key={i} className={i < view.lives ? '' : 'lost'}>♥</b>)}</span></div><p>A missed room costs a heart. Build all 20 floors.</p></div></section>
      <section className="how-card"><span className="tiny-star">✳</span><h2>Small drops.<br />Big dreams.</h2><p>Line it up. Let it go.<br />Finish all 20 floors to open your apartment house.</p><div className="tip"><span>01</span><p><strong>Find your rhythm</strong>The room hangs close to the building. Follow its landing guide.</p></div><div className="tip"><span>02</span><p><strong>Keep it tidy</strong>Align each room with the floor below. Offsets narrow your building.</p></div><div className="tip"><span>03</span><p><strong>Chase the perfect drop</strong>Earn bonus points. Land 3 in a row to widen your next floor.</p></div><div className="perfect-badge"><span>✦</span> PERFECT DROP = BONUS POINTS</div></section>
      <div className="side-note"><span>↗</span> It gets a little trickier up there.<br />That’s half the fun.</div></aside></div>
      <footer><span>BUILT FOR THE JUST-ONE-MORE-TRY KIND OF PERSON.</span><span>NO RUSH. JUST REACH. <span className="footer-star">✳</span></span></footer>
    </main>
  </div>;
}
export default App;
