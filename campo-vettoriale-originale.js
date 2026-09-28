/* =====================================================================
   CAMPO VETTORIALE — GLM Architect
   Versione originale (da campo-vettoriale2.html), non ottimizzata.
   Il file è autonomo: inserisce da solo font, stili e struttura della
   pagina, poi avvia il campo. Basta caricarlo con:
   <script src="campo-vettoriale-originale.js"></script>
   ===================================================================== */

/* 0. FONT, STILI E STRUTTURA (identici al file HTML originale) */
(() => {
const font = document.createElement('link');
font.rel = 'stylesheet';
font.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&display=swap';
document.head.appendChild(font);

const style = document.createElement('style');
style.textContent = `
  /* Colori: bianco e nero come nel riferimento. In modalità scura si invertono. */
  :root {
    --bg: #ffffff;
    --ink: #000000;
    --muted: #6b6b6b;
    --line: rgba(0, 0, 0, 0.16);
    --panel: rgba(255, 255, 255, 0.92);
    box-sizing: border-box;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #000000;
      --ink: #ffffff;
      --muted: #9a9a9a;
      --line: rgba(255, 255, 255, 0.2);
      --panel: rgba(0, 0, 0, 0.9);
    }
  }
  :root[data-theme="dark"] {
    --bg: #000000;
    --ink: #ffffff;
    --muted: #9a9a9a;
    --line: rgba(255, 255, 255, 0.2);
    --panel: rgba(0, 0, 0, 0.9);
  }
  html { scroll-padding-top: env(safe-area-inset-top, 0px); height: 100%; background: var(--bg); }
  body {
    height: 100%; margin: 0; overflow: hidden;
    background: var(--bg); color: var(--ink);
    font-family: "Archivo", "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  #field { position: fixed; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }

  /* Testo sopra il campo: un alone del colore di sfondo lo tiene leggibile */
  .halo { text-shadow: 0 0 8px var(--bg), 0 0 8px var(--bg), 0 0 3px var(--bg), 0 0 1px var(--bg); }

  .bar {
    position: fixed; left: 0; right: 0; display: flex; justify-content: space-between;
    gap: 16px; pointer-events: none;
  }
  .bar > * { pointer-events: auto; }
  .top { top: 0; align-items: flex-start; padding: calc(18px + env(safe-area-inset-top, 0px)) 24px 18px; }
  .bottom { bottom: 0; align-items: flex-end; padding: 18px 24px calc(22px + env(safe-area-inset-bottom, 0px)); }

  .hint { font-size: 14px; color: var(--muted); max-width: 40ch; line-height: 1.35; transition: opacity 0.9s ease; pointer-events: none; }
  .hint.gone { opacity: 0; }

  .name { font-size: clamp(26px, 3.6vw, 40px); font-weight: 500; letter-spacing: -0.02em; line-height: 1.02; margin: 0; }

  .plink {
    font-size: 16px; font-weight: 500; color: var(--ink); text-decoration: none;
    padding: 4px 0; border-bottom: 1.5px solid var(--ink);
  }
  .plink:hover { border-bottom-width: 3px; padding-bottom: 3px; }
  .plink:focus-visible, .ptoggle:focus-visible, .panel button:focus-visible, .panel input:focus-visible {
    outline: 2px solid var(--ink); outline-offset: 3px;
  }

  /* Pannello di regolazione (solo nella preview) */
  .ptoggle {
    font: inherit; font-size: 14px; font-weight: 500; color: var(--ink);
    background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 7px 14px; cursor: pointer;
  }
  .panel {
    position: fixed; right: 24px; top: calc(64px + env(safe-area-inset-top, 0px));
    width: min(320px, calc(100% - 48px)); max-height: calc(100% - 150px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
    overflow: auto; padding: 14px 16px 16px; box-sizing: border-box;
    background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
    font-size: 13px;
  }
  .panel[hidden] { display: none; }
  .row { margin-bottom: 11px; }
  .row .lab { display: flex; justify-content: space-between; margin-bottom: 3px; }
  .row .val { color: var(--muted); font-variant-numeric: tabular-nums; }
  .panel input[type="range"] { width: 100%; margin: 0; accent-color: var(--ink); }
  .chk { display: flex; gap: 8px; align-items: center; margin: 4px 0 12px; }
  .chk input { accent-color: var(--ink); }
  .chk + .chk { margin-top: -6px; }
  .btns { display: flex; gap: 8px; margin-bottom: 12px; }
  .btns button {
    flex: 1; font: inherit; font-size: 13px; font-weight: 500; color: var(--ink); background: transparent;
    border: 1px solid var(--ink); border-radius: 6px; padding: 7px 8px; cursor: pointer;
  }
  .btns button:hover { background: var(--ink); color: var(--bg); }
  .panel .cap { color: var(--muted); margin: 0 0 4px; }
  #out {
    width: 100%; box-sizing: border-box; resize: none; font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 11px; line-height: 1.4; color: var(--ink); background: transparent; border: 1px solid var(--line);
    border-radius: 6px; padding: 8px;
  }
`;
document.head.appendChild(style);

document.body.insertAdjacentHTML('beforeend', `
<canvas id="field" aria-label="Interactive vector field: the arrows follow the pointer, creating flows and vortices" role="img"></canvas>

<header class="bar top">
  <p class="hint halo" id="hint"></p>
  <button class="ptoggle" id="ptoggle" type="button" aria-expanded="false" aria-controls="panel" hidden>Adjust</button>
</header>

<aside class="panel" id="panel" hidden aria-label="Field parameters">
  <div id="rows"></div>
  <label class="chk"><input type="checkbox" id="ghost"> Ghost cursor: animates the field even when idle</label>
  <label class="chk"><input type="checkbox" id="cycle"> Change color on every click</label>
  <div class="btns">
    <button type="button" id="reseed">New flow</button>
    <button type="button" id="reset">Reset</button>
  </div>
  <p class="cap">Current values</p>
  <textarea id="out" rows="9" readonly></textarea>
</aside>

<footer class="bar bottom">
  <div class="halo">
    <p class="name" id="name"></p>
  </div>
  <a class="plink halo" id="link" target="_blank" rel="noopener"></a>
</footer>
`);
})();

(() => {
'use strict';

/* =====================================================================
   1. CONTENUTI E PARAMETRI: qui si modifica tutto
   ===================================================================== */
const PREVIEW = true;   // false = versione finale (nasconde il pannello di regolazione)

const CONTENT = {
  name:      'GLM Architect',
  linkLabel: 'Go to portfolio',
  linkUrl:   'https://manganielloarc.wixsite.com/glmarchitect/home',
  hintMouse: 'Move the cursor to wake the field: when you stop, it settles back into order. A click launches a pulse of color.',
  hintTouch: 'Drag a finger to wake the field: when you lift it, it settles back into order.'
};

const DEFAULTS = {
  seed: 7,             // cambia la composizione del flusso di fondo
  spacing: 22,         // distanza media tra le frecce, in px (più basso = più fitto)
  lenGain: 0.7,        // lunghezza delle frecce rispetto all'intensità del flusso
  baseStrength: 1.9,   // intensità del flusso di fondo
  timeScale: 2.35,      // velocità con cui il flusso di fondo evolve
  radius: 130,         // raggio d'influenza del puntatore, in px
  push: 2.9,           // quanto il puntatore spinge le frecce nella sua direzione
  swirl: 1.4,          // quanto il puntatore genera rotazione (vortice)
  persistence: 0.975,  // quanto a lungo restano le scie (0.90 breve, 0.995 lunga)
  lineWidth: 1,      // spessore delle linee, in px
  ghost: false,        // cursore fantasma che anima il campo anche a riposo (spento = da fermo resta ordinato)
  orderAngle: 270,       // direzione dello stato ordinato, in gradi (0 = destra, 90 = su, 180 = sinistra)
  awake: 300,          // raggio del risveglio attorno al puntatore, in px
  calm: 12,             // secondi che il campo impiega per tornare all'ordine
  jitter: 1,         // quanto le frecce escono dalla griglia quando sono risvegliate (0 = restano in griglia)
  pulseHue: 232,       // tonalità (0-360) dell'impulso di colore al clic
  pulseCycle: true,    // true = ogni clic usa una tonalità diversa
  pulseSize: 700,      // ampiezza massima dell'alone di colore, in px
  pulseLife: 2.6,      // durata dell'impulso, in secondi
  pulseSpread: 45,     // scarto di tonalità (gradi) tra centro e bordo della sfumatura
  pulseKick: 1.6       // quanto l'alone spinge le frecce verso l'esterno (0 = per nulla)
};
const cfg = Object.assign({}, DEFAULTS);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

/* =====================================================================
   2. STATO
   ===================================================================== */
const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, dpr = 1;
let N = 0, gx, gy, ox, oy, ux, uy, lf, D;   // griglia, scarto casuale, disturbo del puntatore, lunghezza, risveglio
let waves = [];
const colors = { ink: '#000', dark: false };
const pulses = [];                     // impulsi di colore lanciati dai clic
let clicks = 0;
let spin = 1;                          // senso di rotazione dei vortici (+1 / -1)

const ptr = { x: 0, y: 0, active: false, down: false, lastMove: -1e9, boost: 0 };
const mv = { ax: 0, ay: 0, vx: 0, vy: 0 };
let ghostAmt = 0, t = 0, last = performance.now();
let needDraw = true, prevBusy = true;   // permette di non ridisegnare quando il campo è ordinato e fermo

const DRIFT_X = -0.06, DRIFT_Y = -0.21;   // corrente media, leggermente verso l'alto
const PB = 8;   // livelli della sfumatura di colore
const ORD_M = 0.75;   // intensità (e quindi lunghezza) delle frecce nello stato ordinato
const CD = Math.cos(0.45), SD = Math.sin(0.45);   // apertura della punta delle frecce

/* =====================================================================
   3. GENERATORI
   ===================================================================== */
function rng(seed) {                    // generatore pseudo-casuale ripetibile (mulberry32)
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/* Flusso di fondo: somma di onde sinusoidali su una funzione di corrente ψ.
   La velocità è il rotore di ψ, quindi il campo non ha sorgenti né pozzi:
   solo correnti e vortici, come nel riferimento. */
function buildWaves() {
  const r = rng(cfg.seed * 9973 + 1);
  const size = Math.max(W, H), n = 7;
  waves = [];
  for (let i = 0; i < n; i++) {
    const lambda = size * (0.33 + r() * 0.8);          // lunghezza d'onda
    const k = 2 * Math.PI / lambda;
    const th = r() * Math.PI * 2;
    waves.push({
      kx: k * Math.cos(th), ky: k * Math.sin(th),
      sx: Math.sin(th), sy: -Math.cos(th),             // direzione del contributo (rotore)
      A: 0.30 * (0.6 + 0.8 * r()),                     // ampiezza
      om: (0.15 + r() * 0.35) * (r() < 0.5 ? -1 : 1),  // velocità di evoluzione (rad/s)
      p0: r() * Math.PI * 2, ph: 0
    });
  }
}

/* Frecce: griglia regolare (stato ordinato) più uno scarto casuale che si usa solo quando il campo si risveglia */
function buildPoints() {
  const s = cfg.spacing;
  const cols = Math.floor(W / s) + 3, rows = Math.floor(H / s) + 3;
  const x0 = (W - (cols - 1) * s) / 2, y0 = (H - (rows - 1) * s) / 2;   // griglia centrata
  N = cols * rows;
  gx = new Float32Array(N); gy = new Float32Array(N);
  ox = new Float32Array(N); oy = new Float32Array(N);
  ux = new Float32Array(N); uy = new Float32Array(N);
  lf = new Float32Array(N); D = new Float32Array(N);
  const r = rng(cfg.seed * 7919 + 3);
  let i = 0;
  for (let j = 0; j < rows; j++) {
    for (let c = 0; c < cols; c++, i++) {
      gx[i] = x0 + c * s; gy[i] = y0 + j * s;
      ox[i] = (r() - 0.5) * s; oy[i] = (r() - 0.5) * s;
      lf[i] = 0.75 + r() * 0.5;
    }
  }
  needDraw = true;
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildWaves(); buildPoints();
}

function readColors() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  colors.ink = v || '#000';
  needDraw = true;
  colors.dark = /^#[89a-f][0-9a-f]{5}$/i.test(colors.ink);   // inchiostro chiaro = tema scuro
}

/* =====================================================================
   4. INPUT
   ===================================================================== */
const hintEl = document.getElementById('hint');
function firstInteraction() { hintEl.classList.add('gone'); }

function onUI(e) { return e.target && e.target.closest && e.target.closest('.panel, .ptoggle, .plink'); }

window.addEventListener('pointermove', (e) => {
  if (ptr.active) { mv.ax += e.clientX - ptr.x; mv.ay += e.clientY - ptr.y; }
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true;
  ptr.lastMove = performance.now();
  firstInteraction();
}, { passive: true });

window.addEventListener('pointerdown', (e) => {
  if (onUI(e)) return;
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; ptr.down = true;
  ptr.lastMove = performance.now();
  pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() / 1000,
                hue: (cfg.pulseHue + (cfg.pulseCycle ? clicks * 72 : 0)) % 360 });
  clicks++;
  ptr.boost = 1;                                  // il clic risveglia il campo anche a puntatore fermo
  if (pulses.length > 6) pulses.shift();
  spin = -spin;                                   // ogni clic inverte il senso del vortice
  firstInteraction();
}, { passive: true });

function release(e) {
  ptr.down = false;
  if (e.pointerType && e.pointerType !== 'mouse') ptr.active = false;   // il dito si solleva
}
window.addEventListener('pointerup', release, { passive: true });
window.addEventListener('pointercancel', release, { passive: true });
document.documentElement.addEventListener('mouseleave', () => { ptr.active = false; ptr.down = false; });

/* =====================================================================
   5. CICLO DI ANIMAZIONE
   ===================================================================== */
function ghostPos(tt) {
  return {
    x: W * (0.5 + 0.30 * Math.sin(tt * 0.42 + 1.3) + 0.08 * Math.sin(tt * 1.1)),
    y: H * (0.5 + 0.27 * Math.sin(tt * 0.57) + 0.06 * Math.cos(tt * 0.9))
  };
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (dt <= 0) return;
  const f60 = dt * 60;
  t += dt * cfg.timeScale * (reduceMotion ? 0.25 : 1);

  /* velocità del puntatore, in unità normalizzate e smussate */
  const ex = mv.ax / Math.max(f60, 0.2) / 16, ey = mv.ay / Math.max(f60, 0.2) / 16;
  mv.ax = 0; mv.ay = 0;
  const sm = 1 - Math.exp(-dt / 0.09);
  mv.vx += (ex - mv.vx) * sm; mv.vy += (ey - mv.vy) * sm;

  /* sorgenti di disturbo: puntatore reale e, se è fermo, cursore fantasma */
  const em = [];
  ptr.boost = Math.max(0, ptr.boost - dt / 0.9);
  if (ptr.active) {
    let vx = mv.vx, vy = mv.vy; const m = Math.hypot(vx, vy);
    if (m > 2.5) { vx *= 2.5 / m; vy *= 2.5 / m; }
    let a = 1 - Math.exp(-Math.min(m, 2.5) * 2.2);   // attività: 0 = fermo, vicino a 1 = movimento veloce
    if (ptr.down) a = Math.max(a, 0.85);
    a = Math.max(a, ptr.boost);
    if (a < 0.01) a = 0;
    em.push({ x: ptr.x, y: ptr.y, vx, vy, k: 1, a, press: ptr.down, spin });
  }
  const idle = now - ptr.lastMove > 3500;
  const gTarget = (cfg.ghost && !reduceMotion && idle) ? 1 : 0;
  ghostAmt += (gTarget - ghostAmt) * (1 - Math.exp(-dt / 0.7));
  if (ghostAmt > 0.02) {
    const tt = now / 1000, a = ghostPos(tt), b = ghostPos(tt + 0.05);
    const dl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    em.push({ x: a.x, y: a.y, vx: (b.x - a.x) / dl * 0.9, vy: (b.y - a.y) / dl * 0.9,
              k: ghostAmt * 0.75, a: 0.8, press: false, spin: Math.sin(tt * 0.23) > 0 ? 1 : -1 });
  }

  /* costanti del frame */
  for (const q of waves) q.ph = q.om * t + q.p0;
  const nw = waves.length;
  const decay = Math.pow(cfg.persistence, f60), inj = (1 - decay) * 2.5;
  const sigma = cfg.radius * 0.6, inv2s2 = 1 / (2 * sigma * sigma), cut2 = 9 * sigma * sigma;
  const s = cfg.spacing, maxL = s * 1.0, minL = s * 0.12;
  const bs = cfg.baseStrength, push = cfg.push, swirl = cfg.swirl, gain = cfg.lenGain;
  const paths = [new Path2D(), new Path2D(), new Path2D()];

  /* impulsi di colore: una sfumatura radiale, intensa al centro e sempre più tenue verso l'esterno */
  const nowS = now / 1000, act = [];
  for (let k = pulses.length - 1; k >= 0; k--) {
    const p = pulses[k], age = nowS - p.t0;
    if (age >= cfg.pulseLife) { pulses.splice(k, 1); continue; }
    const u = age / cfg.pulseLife;
    const grow = 1 - (1 - u) * (1 - u);            // l'alone si allarga rallentando
    act.push({ x: p.x, y: p.y, hue: p.hue,
               R: cfg.pulseSize * (0.35 + 0.65 * grow),
               fade: Math.pow(1 - u, 1.5),          // e svanisce dolcemente
               paths: Array.from({ length: PB }, () => new Path2D()) });
  }
  const kick = cfg.pulseKick;

  /* risveglio: dove il campo è "vivo" (0 = ordinato e fermo, 1 = flusso libero) */
  const oa = cfg.orderAngle * Math.PI / 180, ordX = Math.cos(oa) * ORD_M, ordY = -Math.sin(oa) * ORD_M;
  const sigD = cfg.awake * 0.5, invD = 1 / (2 * sigD * sigD), cutD2 = 9 * sigD * sigD;
  const rise = 1 - Math.exp(-dt / 0.25), fall = Math.exp(-dt / (cfg.calm / 3));
  const jit = cfg.jitter;
  const excited = em.some((E) => E.a * E.k > 0.005);
  if (!excited && act.length === 0 && !prevBusy && !needDraw) return;   // ordinato e fermo: niente da ridisegnare
  let busy = act.length > 0;

  for (let i = 0; i < N; i++) {
    /* risveglio locale: sale vicino al puntatore in movimento, poi svanisce da solo */
    let Di = D[i], exc = 0;
    for (let e = 0; e < em.length; e++) {
      const E = em[e];
      if (E.a === 0) continue;
      const ddx = gx[i] - E.x, ddy = gy[i] - E.y, dd2 = ddx * ddx + ddy * ddy;
      if (dd2 > cutD2) continue;
      const v = E.a * E.k * Math.exp(-dd2 * invD);
      if (v > exc) exc = v;
    }
    if (exc > Di) Di += (exc - Di) * rise; else Di *= fall;
    if (Di < 0.002) Di = 0;
    D[i] = Di;
    if (Di > 0) busy = true;
    const Dv = Di * Di * (3 - 2 * Di);              // transizione morbida

    const x = gx[i] + ox[i] * Dv * jit, y = gy[i] + oy[i] * Dv * jit;

    /* campo di base: ordinato (frecce tutte uguali) ↔ flusso libero */
    let bx = ordX, by = ordY;
    if (Dv > 0) {
      let fx = DRIFT_X, fy = DRIFT_Y;
      for (let w = 0; w < nw; w++) {
        const q = waves[w];
        const c = Math.cos(q.kx * x + q.ky * y + q.ph) * q.A;
        fx += q.sx * c; fy += q.sy * c;
      }
      bx = ordX * (1 - Dv) + fx * bs * Dv;
      by = ordY * (1 - Dv) + fy * bs * Dv;
    }

    /* disturbo generato dal puntatore: spinta + vortice */
    let tx = 0, ty = 0;
    for (let e = 0; e < em.length; e++) {
      const E = em[e], dx = x - E.x, dy = y - E.y, d2 = dx * dx + dy * dy;
      if (d2 > cut2) continue;
      const g = Math.exp(-d2 * inv2s2) * E.k;
      tx += E.vx * push * g; ty += E.vy * push * g;
      const r = Math.sqrt(d2);
      if (r > 0.001) {
        const rs = r / sigma, prof = rs * Math.exp(0.5 * (1 - rs * rs)) * E.k;  // nullo al centro, massimo a r = σ
        const sp = Math.min(Math.hypot(E.vx, E.vy), 2);
        const sw = (sp * swirl + (E.press ? swirl * 1.4 : 0)) * prof * E.spin;
        tx += (-dy / r) * sw; ty += (dx / r) * sw;
      }
    }
    let uxi = ux[i] * decay + tx * inj, uyi = uy[i] * decay + ty * inj;
    const um = uxi * uxi + uyi * uyi;
    if (um > 9) { const k = 3 / Math.sqrt(um); uxi *= k; uyi *= k; }
    else if (um < 4e-6) { uxi = 0; uyi = 0; }        // a riposo il campo torna esattamente all'ordine
    ux[i] = uxi; uy[i] = uyi;
    if (uxi !== 0 || uyi !== 0) busy = true;

    /* freccia */
    let vx = bx + uxi, vy = by + uyi;
    let pBest = -1, iBest = 0;
    for (let k = 0; k < act.length; k++) {
      const A = act[k], dx = x - A.x, dy = y - A.y, dist = Math.sqrt(dx * dx + dy * dy);
      const g = 1 - dist / A.R;                    // 1 al centro, 0 al bordo dell'alone
      if (g <= 0) continue;
      const inten = g * g * (3 - 2 * g) * A.fade;  // discesa morbida (smoothstep)
      if (inten < 0.03) continue;
      if (dist > 0.001) { vx += dx / dist * kick * inten; vy += dy / dist * kick * inten; }
      if (inten > iBest) { iBest = inten; pBest = k; }
    }
    const m = Math.hypot(vx, vy);
    if (m < 1e-4) continue;
    const L = minL + maxL * Math.tanh(m * gain) * (1 + (lf[i] - 1) * Dv);
    const c = vx / m, sn = vy / m, hx = c * L * 0.5, hy = sn * L * 0.5;
    const P = paths[L < maxL * 0.3 ? 0 : (L < maxL * 0.65 ? 1 : 2)];
    const Q = (pBest >= 0) ? act[pBest].paths[Math.min(PB - 1, Math.floor(iBest * PB))] : null;
    const tipX = x + hx, tipY = y + hy;
    P.moveTo(x - hx, y - hy); P.lineTo(tipX, tipY);
    if (Q) { Q.moveTo(x - hx, y - hy); Q.lineTo(tipX, tipY); }
    if (L > 3) {
      const hl = Math.min(L * 0.34, 4.5) + 1;
      const ax = tipX + hl * (-c * CD + sn * SD), ay = tipY + hl * (-c * SD - sn * CD);
      const cx = tipX + hl * (-c * CD - sn * SD), cy = tipY + hl * ( c * SD - sn * CD);
      P.moveTo(tipX, tipY); P.lineTo(ax, ay);
      P.moveTo(tipX, tipY); P.lineTo(cx, cy);
      if (Q) { Q.moveTo(tipX, tipY); Q.lineTo(ax, ay); Q.moveTo(tipX, tipY); Q.lineTo(cx, cy); }
    }
  }

  prevBusy = busy; needDraw = false;
  ctx.clearRect(0, 0, W, H);
  ctx.lineWidth = cfg.lineWidth; ctx.lineCap = 'round'; ctx.strokeStyle = colors.ink;
  const alphas = [0.38, 0.68, 1];
  for (let b = 0; b < 3; b++) { ctx.globalAlpha = alphas[b]; ctx.stroke(paths[b]); }

  /* alone colorato: si sovrappone alle frecce nere e le copre man mano che l'intensità sale */
  ctx.lineWidth = cfg.lineWidth * 1.2;
  const lgt = colors.dark ? 62 : 50, spread = cfg.pulseSpread;
  for (let k = 0; k < act.length; k++) {
    for (let b = 0; b < PB; b++) {
      const tt = (b + 0.5) / PB;                    // 0 = bordo, 1 = centro
      const h = (act[k].hue + spread * (1 - tt)) % 360;
      ctx.strokeStyle = 'hsl(' + h + ', 85%, ' + (lgt + 8 * (1 - tt)) + '%)';
      ctx.globalAlpha = 0.08 + 0.8 * tt;
      ctx.stroke(act[k].paths[b]);
    }
  }
  ctx.globalAlpha = 1;
}

/* =====================================================================
   6. PANNELLO DI REGOLAZIONE (solo preview)
   ===================================================================== */
const SCHEMA = [
  { key: 'spacing',      label: 'Arrow spacing (px)', min: 12,   max: 44,    step: 1,     rebuild: true },
  { key: 'lenGain',      label: 'Arrow length',      min: 0.3,  max: 2.5,   step: 0.05 },
  { key: 'lineWidth',    label: 'Line thickness',        min: 0.5,  max: 2,     step: 0.1 },
  { key: 'baseStrength', label: 'Background flow',             min: 0,    max: 2.5,   step: 0.05 },
  { key: 'timeScale',    label: 'Flow speed',         min: 0,    max: 3,     step: 0.05 },
  { key: 'radius',       label: 'Pointer radius (px)',   min: 50,   max: 320,   step: 5 },
  { key: 'push',         label: 'Push',                      min: 0,    max: 4,     step: 0.1 },
  { key: 'swirl',        label: 'Swirl',                     min: 0,    max: 4,     step: 0.1 },
  { key: 'persistence',  label: 'Trail persistence',      min: 0.9,  max: 0.995, step: 0.001 }
];

SCHEMA.unshift(
  { key: 'orderAngle', label: 'Resting direction (degrees)', min: 0,   max: 360, step: 5 },
  { key: 'awake',      label: 'Wake-up radius (px)',               min: 100, max: 800, step: 10 },
  { key: 'calm',       label: 'Return to order (s)',                 min: 1,   max: 12,  step: 0.5 },
  { key: 'jitter',     label: 'Position disorder',              min: 0,   max: 1,   step: 0.05 }
);

SCHEMA.push(
  { key: 'pulseHue',  label: 'Pulse color (hue)', min: 0,   max: 360, step: 1 },
  { key: 'pulseSize', label: 'Glow size (px)',       min: 100, max: 700, step: 10 },
  { key: 'pulseLife', label: 'Pulse duration (s)',        min: 0.6, max: 4,   step: 0.1 },
  { key: 'pulseSpread', label: 'Color gradient (degrees)',   min: 0,   max: 120, step: 1 },
  { key: 'pulseKick', label: 'Outward push',       min: 0,   max: 2,   step: 0.05 }
);

function setupPanel() {
  const toggle = document.getElementById('ptoggle'), panel = document.getElementById('panel');
  const rows = document.getElementById('rows'), out = document.getElementById('out');
  const ghost = document.getElementById('ghost');
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });

  const inputs = {};
  const refreshOut = () => { needDraw = true; out.value = JSON.stringify(cfg, null, 2); };
  const fmt = (k, v) => (k === 'persistence' ? v.toFixed(3) : (Number.isInteger(v) ? String(v) : v.toFixed(2)));

  SCHEMA.forEach((s) => {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'lab';
    const name = document.createElement('span'); name.textContent = s.label;
    const val = document.createElement('span'); val.className = 'val';
    lab.append(name, val);
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = s.min; inp.max = s.max; inp.step = s.step; inp.value = cfg[s.key];
    val.textContent = fmt(s.key, cfg[s.key]);
    inp.addEventListener('input', () => {
      cfg[s.key] = parseFloat(inp.value);
      val.textContent = fmt(s.key, cfg[s.key]);
      if (s.rebuild) buildPoints();
      refreshOut();
    });
    row.append(lab, inp); rows.append(row);
    inputs[s.key] = { inp, val };
  });

  ghost.checked = cfg.ghost;
  ghost.addEventListener('change', () => { cfg.ghost = ghost.checked; refreshOut(); });

  const cycle = document.getElementById('cycle');
  cycle.checked = cfg.pulseCycle;
  cycle.addEventListener('change', () => { cfg.pulseCycle = cycle.checked; refreshOut(); });

  document.getElementById('reseed').addEventListener('click', () => {
    cfg.seed = 1 + Math.floor(Math.random() * 9999);
    buildWaves(); buildPoints(); refreshOut();
  });
  document.getElementById('reset').addEventListener('click', () => {
    Object.assign(cfg, DEFAULTS);
    cycle.checked = cfg.pulseCycle;
    SCHEMA.forEach((s) => { inputs[s.key].inp.value = cfg[s.key]; inputs[s.key].val.textContent = fmt(s.key, cfg[s.key]); });
    ghost.checked = cfg.ghost;
    buildWaves(); buildPoints(); refreshOut();
  });
  refreshOut();
}

/* =====================================================================
   7. AVVIO
   ===================================================================== */
document.getElementById('name').textContent = CONTENT.name;
const linkEl = document.getElementById('link');
linkEl.textContent = CONTENT.linkLabel; linkEl.href = CONTENT.linkUrl;
hintEl.textContent = coarse ? CONTENT.hintTouch : CONTENT.hintMouse;

readColors();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 120); });

resize();
if (PREVIEW) setupPanel();
requestAnimationFrame(frame);
})();
