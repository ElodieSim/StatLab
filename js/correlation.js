/* Module 5 — Corrélation */
'use strict';

/** Génère n points dont la corrélation vaut environ r. */
function makeCloud(r, n) {
  const xs = [], ys = [];
  for (let i = 0; i < n; i++) {
    const x = Rand.normal();
    xs.push(x);
    ys.push(r * x + Math.sqrt(1 - r * r) * Rand.normal());
  }
  return { xs, ys, r: Stats.correlation(xs, ys) };
}

function drawScatter(svg, { xs, ys }, { size = 360, pad = 20, dot = 4, regression = false } = {}) {
  svg.innerHTML = '';
  const range = (a) => { const lo = Math.min(...a), hi = Math.max(...a); return [lo, hi - lo || 1]; };
  const [xl, xw] = range(xs), [yl, yw] = range(ys);
  const px = (x) => pad + ((x - xl) / xw) * (size - 2 * pad);
  const py = (y) => size - pad - ((y - yl) / yw) * (size - 2 * pad);
  svgEl('line', { class: 'axis', x1: pad / 2, x2: size - pad / 2, y1: size - pad / 2, y2: size - pad / 2 }, svg);
  svgEl('line', { class: 'axis', x1: pad / 2, x2: pad / 2, y1: pad / 2, y2: size - pad / 2 }, svg);
  xs.forEach((x, i) => svgEl('circle', { class: 'pt', cx: px(x), cy: py(ys[i]), r: dot, opacity: 0.75 }, svg));
  if (regression) {
    // Droite des moindres carrés : y = a x + b
    const mx = Stats.mean(xs), my = Stats.mean(ys);
    let sxy = 0, sxx = 0;
    xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
    const a = sxy / sxx, b = my - a * mx;
    const x1 = xl, x2 = xl + xw;
    svgEl('line', { class: 'reg', x1: px(x1), y1: py(a * x1 + b), x2: px(x2), y2: py(a * x2 + b) }, svg);
  }
}

function initMiniScatters() {
  const box = document.getElementById('mini-scatters');
  [[-0.9, 'r ≈ −0,9 : forte, décroissante'], [0, 'r ≈ 0 : aucune tendance'], [0.5, 'r ≈ 0,5 : modérée, croissante'], [0.95, 'r ≈ 0,95 : forte, croissante']]
    .forEach(([r, caption]) => {
      const svg = svgEl('svg', { class: 'chart', viewBox: '0 0 200 200', role: 'img', 'aria-label': caption });
      drawScatter(svg, makeCloud(r, 60), { size: 200, pad: 14, dot: 3 });
      box.append(el('figure', { class: 'card', style: 'margin:0;padding:10px' }, [svg, el('figcaption', {}, [caption])]));
    });
}

function initGame() {
  new GameShell(document.getElementById('game'), {
    id: 'correlation',
    title: 'Devine la corrélation',
    rounds: 5,
    pointsPerRound: 100,
    description: '5 nuages de points à analyser. Estime le coefficient r au curseur : 100 points pour une estimation parfaite.',
    onRound(body, game) {
      const target = Math.random() < 0.2 ? Rand.normal(0, 0.1) : Math.random() * 1.9 - 0.95;
      const cloud = makeCloud(clamp(target, -0.97, 0.97), 70);
      const svg = svgEl('svg', { class: 'chart', viewBox: '0 0 360 360', role: 'img', 'aria-label': 'Nuage de points', style: 'max-width:420px;margin:0 auto' });
      drawScatter(svg, cloud);

      const slider = el('input', { type: 'range', min: '-1', max: '1', step: '0.05', value: '0', 'aria-label': 'Ton estimation de r' });
      const out = el('output', {}, ['0']);
      slider.addEventListener('input', () => { out.textContent = fmt(Number(slider.value), 2); });
      const btn = el('button', { class: 'btn btn-primary', type: 'button' }, ['Valider mon estimation']);
      btn.addEventListener('click', () => {
        slider.disabled = btn.disabled = true;
        const guess = Number(slider.value);
        const err = Math.abs(guess - cloud.r);
        const pts = Math.round(clamp(100 - err * 150, 0, 100));
        drawScatter(svg, cloud, { regression: true });
        const level = err <= 0.1 ? 'ok' : err <= 0.25 ? 'mid' : 'bad';
        const hint = cloud.r > 0.7 ? 'Les points forment une bande étroite qui monte : relation forte et croissante.'
          : cloud.r < -0.7 ? 'Les points forment une bande étroite qui descend : relation forte et décroissante.'
            : Math.abs(cloud.r) < 0.2 ? 'Le nuage est informe, sans direction : pas de relation linéaire.'
              : `On devine une tendance ${cloud.r > 0 ? 'croissante' : 'décroissante'}, mais les points sont assez dispersés autour de la droite.`;
        game.answer(pts, level,
          `Ton estimation : ${fmt(guess, 2)} — vraie valeur : <strong>r = ${fmt(cloud.r, 2)}</strong> (écart ${fmt(err, 2)}) → <strong>+${pts} points</strong>.<br>${hint}`);
      });

      body.append(
        el('div', { class: 'game-question' }, ['Quel est le coefficient de corrélation de ce nuage ?']),
        svg,
        el('div', { class: 'slider-row', style: 'margin:12px 0' }, [el('span', {}, ['−1']), slider, el('span', {}, ['+1']), out]),
        btn,
      );
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMiniScatters();
  initGame();
});
