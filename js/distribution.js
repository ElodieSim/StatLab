/* Module 4 — Distributions */
'use strict';

/* ---------- Planche de Galton ---------- */
function binomial(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return r;
}

function initGalton() {
  const canvas = document.getElementById('galton');
  const ctx = canvas.getContext('2d');
  const countEl = document.getElementById('galton-count');
  const rowsInput = document.getElementById('galton-rows');
  const rowsOut = document.getElementById('galton-rows-out');
  const H = 420, SPEED = 0.14;

  let rows = Number(rowsInput.value);
  let counts, balls, queue, total, running = false, W = 600;

  function reset() {
    counts = new Array(rows + 1).fill(0);
    balls = [];
    queue = 0;
    total = 0;
  }

  function resize() {
    W = canvas.clientWidth || 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  const geom = () => {
    const dx = Math.min((W - 30) / (rows + 1), 44);
    const top = 30, dy = Math.min(16, 200 / rows);
    return { dx, dy, top, cx: W / 2, binTop: top + rows * dy + 14 };
  };
  const xAt = (g, r, k) => g.cx + (k - r / 2) * g.dx;

  function draw() {
    const css = getComputedStyle(document.documentElement);
    const col = (v) => css.getPropertyValue(v).trim();
    const g = geom();
    ctx.clearRect(0, 0, W, H);

    // Clous
    ctx.fillStyle = col('--muted');
    for (let r = 0; r < rows; r++) {
      for (let j = 0; j <= r; j++) {
        ctx.beginPath();
        ctx.arc(xAt(g, r, j), g.top + r * g.dy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Cases et barres
    const bottom = H - 22;
    const expected = counts.map((_, k) => (total * binomial(rows, k)) / 2 ** rows);
    const scaleMax = Math.max(1, ...counts, ...expected) * 1.1;
    const hOf = (v) => (v / scaleMax) * (bottom - g.binTop);
    ctx.strokeStyle = col('--border');
    ctx.lineWidth = 1;
    for (let k = 0; k <= rows + 1; k++) {
      const x = xAt(g, rows, k) - g.dx / 2;
      ctx.beginPath(); ctx.moveTo(x, g.binTop); ctx.lineTo(x, bottom); ctx.stroke();
    }
    ctx.fillStyle = col('--c1');
    counts.forEach((c, k) => {
      const h = hOf(c);
      ctx.fillRect(xAt(g, rows, k) - g.dx * 0.38, bottom - h, g.dx * 0.76, h);
    });
    ctx.fillStyle = col('--muted');
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    counts.forEach((c, k) => ctx.fillText(String(c), xAt(g, rows, k), bottom + 15));

    // Courbe théorique
    if (total > 0) {
      ctx.strokeStyle = col('--c3');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      expected.forEach((e, k) => {
        const x = xAt(g, rows, k), y = bottom - hOf(e);
        if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.stroke();
    }

    // Billes en mouvement
    ctx.fillStyle = col('--c2');
    balls.forEach((b) => {
      const r = Math.floor(b.t);
      const f = b.t - r;
      let x, y;
      if (r < rows) {
        const k0 = b.rights[r];
        const k1 = b.rights[r + 1];
        x = xAt(g, r, k0) + (xAt(g, r + 1, k1) - xAt(g, r, k0)) * f;
        y = g.top + (r + f) * g.dy - 6 - Math.sin(f * Math.PI) * 5;
      } else {
        const k = b.rights[rows];
        x = xAt(g, rows, k);
        y = g.top + rows * g.dy - 6 + (f * (bottom - g.top - rows * g.dy));
      }
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    countEl.textContent = `${fmt(total, 0)} bille${total > 1 ? 's' : ''} tombée${total > 1 ? 's' : ''}`;
  }

  function spawn() {
    // rights[r] = nombre de rebonds à droite après r rangées.
    const rights = [0];
    for (let r = 0; r < rows; r++) rights.push(rights[r] + (Math.random() < 0.5 ? 0 : 1));
    balls.push({ t: 0, rights });
  }

  function step() {
    const burst = queue > 100 ? 3 : 1;
    for (let i = 0; i < burst && queue > 0; i++) { spawn(); queue--; }
    balls.forEach((b) => { b.t += SPEED; });
    balls = balls.filter((b) => {
      if (b.t >= rows + 1) { counts[b.rights[rows]]++; total++; return false; }
      return true;
    });
    draw();
    if (balls.length || queue > 0) requestAnimationFrame(step);
    else running = false;
  }

  function drop(n) {
    queue += n;
    if (!running) { running = true; requestAnimationFrame(step); }
  }

  document.querySelectorAll('[data-drop]').forEach((b) => b.addEventListener('click', () => drop(Number(b.dataset.drop))));
  document.getElementById('galton-reset').onclick = () => { reset(); draw(); };
  rowsInput.addEventListener('input', () => {
    rows = Number(rowsInput.value);
    rowsOut.textContent = rows;
    reset();
    draw();
  });
  window.addEventListener('resize', resize);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);

  reset();
  resize();
}

/* ---------- Jeu : moyenne ou médiane ? ---------- */
const SHAPES = {
  sym: () => Rand.normal(50, 13),
  right: () => 8 + Rand.exponential(16),
  left: () => 92 - Rand.exponential(16),
};

function drawHistogram(svg, data, showLines) {
  const X0 = 20, X1 = 580, Y0 = 34, Y1 = 200, BIN = 5;
  const xOf = (v) => X0 + (v / 100) * (X1 - X0);
  const bins = new Array(100 / BIN).fill(0);
  data.forEach((v) => { bins[Math.min(bins.length - 1, Math.floor(v / BIN))]++; });
  const max = Math.max(...bins);
  svg.innerHTML = '';
  bins.forEach((c, i) => {
    const h = (c / max) * (Y1 - Y0);
    if (c) svgEl('rect', { class: 'bar', x: xOf(i * BIN) + 1, y: Y1 - h, width: xOf(BIN) - X0 - 2, height: h }, svg);
  });
  svgEl('line', { class: 'axis', x1: X0, x2: X1, y1: Y1, y2: Y1 }, svg);
  for (let v = 0; v <= 100; v += 20) svgEl('text', { x: xOf(v), y: Y1 + 18, 'text-anchor': 'middle', text: v }, svg);
  if (showLines) {
    const m = Stats.mean(data), med = Stats.median(data);
    const meanLeft = m < med;
    svgEl('line', { class: 'mean-line', x1: xOf(m), x2: xOf(m), y1: Y0 - 14, y2: Y1 }, svg);
    svgEl('line', { class: 'median-line', x1: xOf(med), x2: xOf(med), y1: Y0 - 14, y2: Y1 }, svg);
    svgEl('text', { class: 'mean-label', x: xOf(m) + (meanLeft ? -5 : 5), y: 14, 'text-anchor': meanLeft ? 'end' : 'start', text: `moyenne ${fmt(m, 1)}` }, svg);
    svgEl('text', { class: 'median-label', x: xOf(med) + (meanLeft ? 5 : -5), y: 14, 'text-anchor': meanLeft ? 'start' : 'end', text: `médiane ${fmt(med, 1)}` }, svg);
  }
}

function initGame() {
  new GameShell(document.getElementById('game'), {
    id: 'distribution',
    title: 'Moyenne ou médiane ?',
    rounds: 8,
    description: 'Un histogramme de 400 valeurs s\'affiche. Devine si la moyenne est plus grande, à peu près égale ou plus petite que la médiane.',
    onRound(body, game) {
      const shape = Rand.pick(['sym', 'right', 'left']);
      const data = Array.from({ length: 400 }, () => clamp(SHAPES[shape](), 0, 99.9));
      const truth = { right: 0, sym: 1, left: 2 }[shape];
      const svg = svgEl('svg', { class: 'chart', viewBox: '0 0 600 225', role: 'img', 'aria-label': 'Histogramme' });
      drawHistogram(svg, data, false);

      const labels = ['Moyenne > médiane', 'Moyenne ≈ médiane', 'Moyenne < médiane'];
      const buttons = labels.map((lab, i) => el('button', { class: 'choice', type: 'button', onclick: () => choose(i) }, [lab]));
      const why = [
        'La distribution a une longue queue vers la <strong>droite</strong> (quelques grandes valeurs) : elles tirent la moyenne vers le haut, au-dessus de la médiane.',
        'La distribution est <strong>symétrique</strong> : la moyenne et la médiane sont quasiment confondues, au centre.',
        'La distribution a une longue queue vers la <strong>gauche</strong> (quelques petites valeurs) : elles tirent la moyenne vers le bas, sous la médiane.',
      ][truth];

      function choose(i) {
        buttons.forEach((b, j) => {
          b.disabled = true;
          if (j === truth) b.classList.add('correct');
          else if (j === i) b.classList.add('wrong');
        });
        drawHistogram(svg, data, true);
        const ok = i === truth;
        game.answer(ok ? 1 : 0, ok ? 'ok' : 'bad',
          `${why}<br>Ici : moyenne = ${fmt(Stats.mean(data), 1)}, médiane = ${fmt(Stats.median(data), 1)}.`);
      }

      body.append(
        el('div', { class: 'game-question' }, ['Comment se situe la moyenne par rapport à la médiane ?']),
        svg,
        el('div', { class: 'choices', style: 'margin-top:12px' }, buttons),
      );
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initGalton();
  initGame();
});
