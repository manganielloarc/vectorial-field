/* =====================================================================
   CAMPO VETTORIALE — GLM Architect — versione per Wix
   Caricato da Wix con:
   <script src="https://cdn.jsdelivr.net/gh/manganielloarc/vectorial-field@main/campo-vettoriale.js" defer></script>
   Inserisce da solo font e stili, poi crea il campo solo sulla pagina in cui Wix lo carica.
   ===================================================================== */
(() => {
if (document.getElementById('gvf-style')) return;
const font = document.createElement('link');
font.rel = 'stylesheet';
font.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500&display=swap';
document.head.appendChild(font);
const style = document.createElement('style');
style.id = 'gvf-style';
style.textContent = `
#gvf{--bg:#fff;--ink:#000;--muted:#6b6b6b;position:fixed;inset:0;z-index:2147483000;background:var(--bg);color:var(--ink);font-family:"Archivo","Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
@media (prefers-color-scheme:dark){#gvf{--bg:#000;--ink:#fff;--muted:#9a9a9a}}
html.gvf-on,html.gvf-on body{overflow:hidden!important}
#gvf canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
#gvf .gvf-halo{text-shadow:0 0 8px var(--bg),0 0 8px var(--bg),0 0 3px var(--bg),0 0 1px var(--bg)}
#gvf .gvf-bar{position:absolute;left:0;right:0;display:flex;justify-content:space-between;gap:16px;pointer-events:none}
#gvf .gvf-bar>*{pointer-events:auto}
#gvf .gvf-top{top:0;padding:calc(18px + env(safe-area-inset-top,0px)) 24px 18px}
#gvf .gvf-bottom{bottom:0;align-items:flex-end;padding:18px 24px calc(22px + env(safe-area-inset-bottom,0px))}
#gvf p{margin:0}
#gvf .gvf-hint{font-size:14px;color:var(--muted);max-width:40ch;line-height:1.35;transition:opacity .9s ease;pointer-events:none}
#gvf .gvf-gone{opacity:0}
#gvf .gvf-name{font-size:clamp(26px,3.6vw,40px);font-weight:500;letter-spacing:-.02em;line-height:1.02}
#gvf .gvf-link{font-size:16px;font-weight:500;color:var(--ink);text-decoration:none;padding:4px 0;border-bottom:1.5px solid var(--ink)}
#gvf .gvf-link:hover{border-bottom-width:3px;padding-bottom:3px}
#gvf{transition:opacity .7s ease}
#gvf.gvf-leave{opacity:0;pointer-events:none}
#gvf .gvf-link:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
`;
document.head.appendChild(style);
})();

(() => {
'use strict';

/* ================= CONTENUTI E PARAMETRI ================= */
/* Wix carica questo script solo sulla pagina scelta nel Codice personalizzato:
   il campo resta legato all'indirizzo su cui si è avviato, qualunque sia il suo nome. */
const HOME_PATH = location.pathname.replace(/\/+$/, '');

const CONTENT = {
  name:      'GLM Architect',
  linkLabel: 'Go to portfolio',
  linkUrl:   'https://www.glmarchitect.com/home',
  hintMouse: 'Move the cursor to wake the field: when you stop, it settles back into order. A click launches a pulse of color.',
  hintTouch: 'Drag a finger to wake the field: when you lift it, it settles back into order.'
};

const cfg = {
  seed: 7, spacing: 22, lenGain: 0.7, baseStrength: 1.9, timeScale: 2.35,
  radius: 130, push: 2.9, swirl: 1.4, persistence: 0.975, lineWidth: 1,
  ghost: false, orderAngle: 270, awake: 300, calm: 12, jitter: 1,
  pulseHue: 232, pulseCycle: true, pulseSize: 700, pulseLife: 2.6,
  pulseSpread: 45, pulseKick: 1.6
};

/* ================= STRUTTURA DELLA PAGINA ================= */
if (document.getElementById('gvf')) return;   // evita doppi caricamenti
const root = document.createElement('div');
root.id = 'gvf';
root.innerHTML =
  '<canvas role="img" aria-label="Interactive vector field: the arrows follow the pointer, creating flows and vortices"></canvas>' +
  '<div class="gvf-bar gvf-top"><p class="gvf-hint gvf-halo"></p></div>' +
  '<div class="gvf-bar gvf-bottom"><p class="gvf-name gvf-halo"></p><a class="gvf-link gvf-halo"></a></div>';
document.body.appendChild(root);

const canvas = root.querySelector('canvas');
const ctx = canvas.getContext('2d');
const hintEl = root.querySelector('.gvf-hint');
const linkEl = root.querySelector('.gvf-link');
root.querySelector('.gvf-name').textContent = CONTENT.name;
linkEl.textContent = CONTENT.linkLabel; linkEl.href = CONTENT.linkUrl;
/* Il campo sta sopra la home: il pulsante lo fa svanire e scopre il portfolio sottostante */
linkEl.addEventListener('click', (e) => {
  e.preventDefault();
  dismissed = true;
  try { sessionStorage.setItem('gvf-dismissed', '1'); } catch (err) {}
  root.classList.add('gvf-leave');
  setTimeout(checkPage, 700);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
hintEl.textContent = coarse ? CONTENT.hintTouch : CONTENT.hintMouse;

/* Il campo è visibile solo sulla sua pagina (Wix cambia pagina senza ricaricare) */
let on = false;
/* Se il visitatore ha già cliccato "Go to portfolio", il campo non ricompare fino alla prossima visita */
let dismissed = false;
try { dismissed = sessionStorage.getItem('gvf-dismissed') === '1'; } catch (e) {}
function checkPage() {
  const now = !dismissed && location.pathname.replace(/\/+$/, '') === HOME_PATH;
  if (now === on) return;
  on = now;
  root.style.display = on ? '' : 'none';
  document.documentElement.classList.toggle('gvf-on', on);
  if (on) { needDraw = true; resize(); }
}

/* ================= STATO ================= */
let W = 0, H = 0, dpr = 1;
let N = 0, gx, gy, ox, oy, ux, uy, lf, D;
let waves = [];
const colors = { ink: '#000', dark: false };
const pulses = [];
let clicks = 0, spin = 1;
const ptr = { x: 0, y: 0, active: false, down: false, lastMove: -1e9, boost: 0 };
const mv = { ax: 0, ay: 0, vx: 0, vy: 0 };
let ghostAmt = 0, t = 0, last = performance.now();
let needDraw = true, prevBusy = true;

const DRIFT_X = -0.06, DRIFT_Y = -0.21;
const PB = 8, ORD_M = 0.75;
const CD = Math.cos(0.45), SD = Math.sin(0.45);

/* ================= GENERATORI ================= */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function buildWaves() {
  const r = rng(cfg.seed * 9973 + 1);
  const size = Math.max(W, H);
  waves = [];
  for (let i = 0; i < 7; i++) {
    const k = 2 * Math.PI / (size * (0.33 + r() * 0.8));
    const th = r() * Math.PI * 2;
    waves.push({
      kx: k * Math.cos(th), ky: k * Math.sin(th),
      sx: Math.sin(th), sy: -Math.cos(th),
      A: 0.30 * (0.6 + 0.8 * r()),
      om: (0.15 + r() * 0.35) * (r() < 0.5 ? -1 : 1),
      p0: r() * Math.PI * 2, ph: 0
    });
  }
}

function buildPoints() {
  const s = cfg.spacing;
  const cols = Math.floor(W / s) + 3, rows = Math.floor(H / s) + 3;
  const x0 = (W - (cols - 1) * s) / 2, y0 = (H - (rows - 1) * s) / 2;
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
  const v = getComputedStyle(root).getPropertyValue('--ink').trim();
  colors.ink = v || '#000';
  colors.dark = /^#[89a-f][0-9a-f]{5}$/i.test(colors.ink);
  needDraw = true;
}

/* ================= INPUT ================= */
function firstInteraction() { hintEl.classList.add('gvf-gone'); }

window.addEventListener('pointermove', (e) => {
  if (!on) return;
  if (ptr.active) { mv.ax += e.clientX - ptr.x; mv.ay += e.clientY - ptr.y; }
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true;
  ptr.lastMove = performance.now();
  firstInteraction();
}, { passive: true });

window.addEventListener('pointerdown', (e) => {
  if (!on || (e.target && e.target.closest && e.target.closest('.gvf-link'))) return;
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; ptr.down = true;
  ptr.lastMove = performance.now();
  pulses.push({ x: e.clientX, y: e.clientY, t0: performance.now() / 1000,
                hue: (cfg.pulseHue + (cfg.pulseCycle ? clicks * 72 : 0)) % 360 });
  clicks++;
  ptr.boost = 1;
  if (pulses.length > 6) pulses.shift();
  spin = -spin;
  firstInteraction();
}, { passive: true });

function release(e) {
  ptr.down = false;
  if (e.pointerType && e.pointerType !== 'mouse') ptr.active = false;
}
window.addEventListener('pointerup', release, { passive: true });
window.addEventListener('pointercancel', release, { passive: true });
document.documentElement.addEventListener('mouseleave', () => { ptr.active = false; ptr.down = false; });

/* ================= ANIMAZIONE ================= */
function ghostPos(tt) {
  return {
    x: W * (0.5 + 0.30 * Math.sin(tt * 0.42 + 1.3) + 0.08 * Math.sin(tt * 1.1)),
    y: H * (0.5 + 0.27 * Math.sin(tt * 0.57) + 0.06 * Math.cos(tt * 0.9))
  };
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!on || dt <= 0) return;
  const f60 = dt * 60;
  t += dt * cfg.timeScale * (reduceMotion ? 0.25 : 1);

  const ex = mv.ax / Math.max(f60, 0.2) / 16, ey = mv.ay / Math.max(f60, 0.2) / 16;
  mv.ax = 0; mv.ay = 0;
  const sm = 1 - Math.exp(-dt / 0.09);
  mv.vx += (ex - mv.vx) * sm; mv.vy += (ey - mv.vy) * sm;

  const em = [];
  ptr.boost = Math.max(0, ptr.boost - dt / 0.9);
  if (ptr.active) {
    let vx = mv.vx, vy = mv.vy; const m = Math.hypot(vx, vy);
    if (m > 2.5) { vx *= 2.5 / m; vy *= 2.5 / m; }
    let a = 1 - Math.exp(-Math.min(m, 2.5) * 2.2);
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

  for (const q of waves) q.ph = q.om * t + q.p0;
  const nw = waves.length;
  const decay = Math.pow(cfg.persistence, f60), inj = (1 - decay) * 2.5;
  const sigma = cfg.radius * 0.6, inv2s2 = 1 / (2 * sigma * sigma), cut2 = 9 * sigma * sigma;
  const s = cfg.spacing, maxL = s, minL = s * 0.12;
  const bs = cfg.baseStrength, push = cfg.push, swirl = cfg.swirl, gain = cfg.lenGain;
  const paths = [new Path2D(), new Path2D(), new Path2D()];

  const nowS = now / 1000, act = [];
  for (let k = pulses.length - 1; k >= 0; k--) {
    const p = pulses[k], age = nowS - p.t0;
    if (age >= cfg.pulseLife) { pulses.splice(k, 1); continue; }
    const u = age / cfg.pulseLife;
    const grow = 1 - (1 - u) * (1 - u);
    act.push({ x: p.x, y: p.y, hue: p.hue,
               R: cfg.pulseSize * (0.35 + 0.65 * grow),
               fade: Math.pow(1 - u, 1.5),
               paths: Array.from({ length: PB }, () => new Path2D()) });
  }
  const kick = cfg.pulseKick;

  const oa = cfg.orderAngle * Math.PI / 180, ordX = Math.cos(oa) * ORD_M, ordY = -Math.sin(oa) * ORD_M;
  const sigD = cfg.awake * 0.5, invD = 1 / (2 * sigD * sigD), cutD2 = 9 * sigD * sigD;
  const rise = 1 - Math.exp(-dt / 0.25), fall = Math.exp(-dt / (cfg.calm / 3));
  const jit = cfg.jitter;
  const excited = em.some((E) => E.a * E.k > 0.005);
  if (!excited && act.length === 0 && !prevBusy && !needDraw) return;
  let busy = act.length > 0;

  for (let i = 0; i < N; i++) {
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
    const Dv = Di * Di * (3 - 2 * Di);

    const x = gx[i] + ox[i] * Dv * jit, y = gy[i] + oy[i] * Dv * jit;

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

    let tx = 0, ty = 0;
    for (let e = 0; e < em.length; e++) {
      const E = em[e], dx = x - E.x, dy = y - E.y, d2 = dx * dx + dy * dy;
      if (d2 > cut2) continue;
      const g = Math.exp(-d2 * inv2s2) * E.k;
      tx += E.vx * push * g; ty += E.vy * push * g;
      const r = Math.sqrt(d2);
      if (r > 0.001) {
        const rs = r / sigma, prof = rs * Math.exp(0.5 * (1 - rs * rs)) * E.k;
        const sp = Math.min(Math.hypot(E.vx, E.vy), 2);
        const sw = (sp * swirl + (E.press ? swirl * 1.4 : 0)) * prof * E.spin;
        tx += (-dy / r) * sw; ty += (dx / r) * sw;
      }
    }
    let uxi = ux[i] * decay + tx * inj, uyi = uy[i] * decay + ty * inj;
    const um = uxi * uxi + uyi * uyi;
    if (um > 9) { const k = 3 / Math.sqrt(um); uxi *= k; uyi *= k; }
    else if (um < 4e-6) { uxi = 0; uyi = 0; }
    ux[i] = uxi; uy[i] = uyi;
    if (uxi !== 0 || uyi !== 0) busy = true;

    let vx = bx + uxi, vy = by + uyi;
    let pBest = -1, iBest = 0;
    for (let k = 0; k < act.length; k++) {
      const A = act[k], dx = x - A.x, dy = y - A.y, dist = Math.sqrt(dx * dx + dy * dy);
      const g = 1 - dist / A.R;
      if (g <= 0) continue;
      const inten = g * g * (3 - 2 * g) * A.fade;
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

  ctx.lineWidth = cfg.lineWidth * 1.2;
  const lgt = colors.dark ? 62 : 50, spread = cfg.pulseSpread;
  for (let k = 0; k < act.length; k++) {
    for (let b = 0; b < PB; b++) {
      const tt = (b + 0.5) / PB;
      const h = (act[k].hue + spread * (1 - tt)) % 360;
      ctx.strokeStyle = 'hsl(' + h + ', 85%, ' + (lgt + 8 * (1 - tt)) + '%)';
      ctx.globalAlpha = 0.08 + 0.8 * tt;
      ctx.stroke(act[k].paths[b]);
    }
  }
  ctx.globalAlpha = 1;
}

/* ================= AVVIO ================= */
readColors();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (on) resize(); }, 120); });
window.addEventListener('popstate', checkPage);
setInterval(checkPage, 400);
root.style.display = 'none';
checkPage();
requestAnimationFrame(frame);
})();
