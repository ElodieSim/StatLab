/* Module 2 — Dispersion */
'use strict';

const DOT = { W: 300, H: 150, X0: 14, X1: 286, AXIS_Y: 120, MIN: 0, MAX: 100 };

/** Dessine un nuage de points sur un axe 0–100 ; avec band=true, affiche moyenne ± 1 écart-type. */
function drawDotPlot(svg, data, cls, band) {
  const { X0, X1, AXIS_Y, MIN, MAX } = DOT;
  const xOf = (v) => X0 + ((v - MIN) / (MAX - MIN)) * (X1 - X0);
  svg.innerHTML = '';
  const m = Stats.mean(data), s = Stats.sd(data);
  if (band) {
    svgEl('rect', { class: 'band', x: xOf(Math.max(MIN, m - s)), y: 8, width: xOf(Math.min(MAX, m + s)) - xOf(Math.max(MIN, m - s)), height: AXIS_Y - 8 }, svg);
    svgEl('line', { class: 'mean-line', x1: xOf(m), x2: xOf(m), y1: 8, y2: AXIS_Y }, svg);
  }
  svgEl('line', { class: 'axis', x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y }, svg);
  for (let v = 0; v <= 100; v += 25) {
    svgEl('line', { class: 'axis', x1: xOf(v), x2: xOf(v), y1: AXIS_Y, y2: AXIS_Y + 5 }, svg);
    svgEl('text', { x: xOf(v), y: AXIS_Y + 20, 'text-anchor': 'middle', text: v }, svg);
  }
  // Regroupe les valeurs par paquets de 4 unités pour les empiler.
  const stack = {};
  data.forEach((v) => {
    const bin = Math.round(v / 4) * 4;
    const k = (stack[bin] = (stack[bin] || 0) + 1) - 1;
    svgEl('circle', { class: `pt ${cls}`, cx: xOf(bin), cy: AXIS_Y - 7 - k * 12, r: 5.5 }, svg);
  });
}

function makeSample(sd) {
  const n = 14;
  // On recentre l'échantillon pour que les deux séries aient la même moyenne (50) :
  // seule la dispersion doit faire la différence.
  const raw = Array.from({ length: n }, () => Rand.normal(0, 1));
  const m = Stats.mean(raw), s = Stats.sd(raw);
  return raw.map((z) => clamp(Math.round(50 + ((z - m) / s) * sd), 0, 100));
}

function initGame() {
  new GameShell(document.getElementById('game'), {
    id: 'dispersion',
    title: 'Le plus dispersé',
    rounds: 10,
    description: 'Les deux séries ont la même moyenne (50). Repère celle qui est la plus étalée. Plus tu avances, plus la différence est subtile.',
    onRound(body, game) {
      // L'écart entre les deux écarts-types diminue au fil des manches.
      const ratio = 2.2 - (game.round - 1) * 0.1;
      const small = Rand.int(8, 13);
      let series = [makeSample(small), makeSample(small * ratio)];
      if (Math.random() < 0.5) series = series.reverse();
      const sds = series.map(Stats.sd);
      const correct = sds[0] >= sds[1] ? 0 : 1;

      const svgs = [], picks = [];
      const grid = el('div', { class: 'pick-grid' });
      ['A', 'B'].forEach((name, i) => {
        const svg = svgEl('svg', { class: 'chart', viewBox: `0 0 ${DOT.W} ${DOT.H}`, role: 'img', 'aria-label': `Série ${name}` });
        drawDotPlot(svg, series[i], i ? 'b' : '', false);
        const info = el('div', { class: 'stats-line' });
        const pick = el('button', { class: 'pick', type: 'button' }, [el('span', { class: 'pick-title' }, [`Série ${name}`]), svg, info]);
        pick.addEventListener('click', () => choose(i));
        svgs.push(svg); picks.push({ pick, info });
        grid.append(pick);
      });

      function choose(i) {
        picks.forEach(({ pick, info }, j) => {
          pick.disabled = true;
          drawDotPlot(svgs[j], series[j], j ? 'b' : '', true);
          info.innerHTML = `Écart-type ≈ <b class="mean">${fmt(sds[j], 1)}</b> · étendue = ${Stats.range(series[j])}`;
          if (j === correct) pick.classList.add('correct');
          else if (j === i) pick.classList.add('wrong');
        });
        const ok = i === correct;
        game.answer(ok ? 1 : 0, ok ? 'ok' : 'bad',
          `La série <strong>${correct ? 'B' : 'A'}</strong> a l'écart-type le plus grand (${fmt(sds[correct], 1)} contre ${fmt(sds[1 - correct], 1)}).
          La bande colorée montre la zone « moyenne ± 1 écart-type » : plus elle est large, plus les données sont dispersées.`);
      }

      body.append(el('div', { class: 'game-question' }, ['Quelle série a le plus grand écart-type ?']), grid);
    },
  });
}

document.addEventListener('DOMContentLoaded', initGame);
