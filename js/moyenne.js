/* Module 1 — Moyenne, médiane, mode */
'use strict';

/* ---------- Laboratoire : points déplaçables sur un axe ---------- */
function initLab() {
  const svg = document.getElementById('lab-svg');
  const statsEl = document.getElementById('lab-stats');
  const W = 600, X0 = 30, X1 = 570, MIN = 0, MAX = 20, AXIS_Y = 150, MAX_POINTS = 30;
  const INITIAL = [4, 6, 7, 7, 9, 12];
  let data = [...INITIAL];
  let dragIndex = null;

  const xOf = (v) => X0 + ((v - MIN) / (MAX - MIN)) * (X1 - X0);
  const valueAt = (clientX) => {
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) * W) / rect.width;
    return clamp(Math.round(MIN + ((x - X0) / (X1 - X0)) * (MAX - MIN)), MIN, MAX);
  };

  function render() {
    svg.innerHTML = '';
    // Axe gradué
    svgEl('line', { class: 'axis', x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y }, svg);
    for (let v = MIN; v <= MAX; v++) {
      const big = v % 2 === 0;
      svgEl('line', { class: 'axis', x1: xOf(v), x2: xOf(v), y1: AXIS_Y, y2: AXIS_Y + (big ? 7 : 4) }, svg);
      if (big) svgEl('text', { x: xOf(v), y: AXIS_Y + 22, 'text-anchor': 'middle', text: v }, svg);
    }
    if (data.length) {
      const m = Stats.mean(data), med = Stats.median(data);
      svgEl('line', { class: 'mean-line', x1: xOf(m), x2: xOf(m), y1: 22, y2: AXIS_Y }, svg);
      svgEl('text', { class: 'mean-label', x: xOf(m), y: 16, 'text-anchor': 'middle', text: `moyenne ${fmt(m, 1)}` }, svg);
      svgEl('line', { class: 'median-line', x1: xOf(med), x2: xOf(med), y1: 40, y2: AXIS_Y }, svg);
      svgEl('text', { class: 'median-label', x: xOf(med), y: 36, 'text-anchor': 'middle', text: `médiane ${fmt(med, 1)}` }, svg);
    }
    // Points empilés quand plusieurs valeurs sont identiques
    const stack = {};
    data.forEach((v, i) => {
      const k = (stack[v] = (stack[v] || 0) + 1) - 1;
      const c = svgEl('circle', { class: 'pt drag', cx: xOf(v), cy: AXIS_Y - 10 - k * 17, r: 8, 'data-i': i }, svg);
      svgEl('title', { text: `Valeur ${v} — fais-moi glisser` }, c);
    });
    renderStats();
  }

  function renderStats() {
    if (!data.length) {
      statsEl.textContent = 'Aucune valeur : clique sur l\'axe pour en ajouter.';
      return;
    }
    const modes = Stats.modes(data);
    const modeTxt = modes.length === data.length && data.length > 1 ? 'aucun (toutes les valeurs sont uniques)'
      : modes.map((x) => fmt(x)).join(' et ');
    statsEl.innerHTML = `Valeurs triées : ${Stats.sorted(data).join(', ')} (${data.length} valeurs)<br>
      <b class="mean">Moyenne = ${fmt(Stats.mean(data))}</b> ·
      <b class="median">Médiane = ${fmt(Stats.median(data))}</b> ·
      <b>Mode = ${modeTxt}</b>`;
  }

  svg.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (e.target.dataset && e.target.dataset.i !== undefined) {
      dragIndex = Number(e.target.dataset.i);
    } else if (data.length < MAX_POINTS) {
      data.push(valueAt(e.clientX));
      dragIndex = data.length - 1;
      render();
    }
    if (dragIndex !== null) svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (dragIndex === null) return;
    const v = valueAt(e.clientX);
    if (v !== data[dragIndex]) {
      data[dragIndex] = v;
      render();
    }
  });
  const stop = () => { dragIndex = null; };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);

  document.getElementById('lab-add').onclick = () => {
    if (data.length < MAX_POINTS) { data.push(Rand.int(2, 14)); render(); }
  };
  document.getElementById('lab-extreme').onclick = () => {
    if (data.length < MAX_POINTS) { data.push(20); render(); }
  };
  document.getElementById('lab-remove').onclick = () => { data.pop(); render(); };
  document.getElementById('lab-reset').onclick = () => { data = [...INITIAL]; render(); };

  render();
}

/* ---------- Jeu : le défi du calcul ---------- */
function makeSeries(kind) {
  const n = Rand.int(5, 7);
  if (kind !== 'mode') return Array.from({ length: n }, () => Rand.int(1, 20));
  // Pour le mode, on garantit une seule valeur plus fréquente que les autres.
  const modeVal = Rand.int(1, 20);
  const reps = Rand.int(2, 3);
  const others = Rand.shuffle(Array.from({ length: 20 }, (_, i) => i + 1).filter((v) => v !== modeVal))
    .slice(0, n - reps);
  return Rand.shuffle([...Array(reps).fill(modeVal), ...others]);
}

function explain(kind, data) {
  const sorted = Stats.sorted(data);
  if (kind === 'mean') {
    return `Somme = ${data.join(' + ')} = <strong>${Stats.sum(data)}</strong>, effectif = ${data.length}.<br>
      Moyenne = ${Stats.sum(data)} ÷ ${data.length} ≈ <strong>${fmt(Stats.mean(data), 2)}</strong>`;
  }
  if (kind === 'median') {
    const n = sorted.length, m = Math.floor(n / 2);
    const shown = sorted.map((v, i) => (n % 2 ? i === m : i === m || i === m - 1) ? `<strong>${v}</strong>` : v).join(', ');
    return n % 2
      ? `Valeurs rangées : ${shown}. Il y a ${n} valeurs, celle du milieu est la ${m + 1}<sup>e</sup> : médiane = <strong>${fmt(Stats.median(data))}</strong>.`
      : `Valeurs rangées : ${shown}. Il y a ${n} valeurs (nombre pair) : on fait la moyenne des deux du milieu, (${sorted[m - 1]} + ${sorted[m]}) ÷ 2 = <strong>${fmt(Stats.median(data))}</strong>.`;
  }
  const mode = Stats.modes(data)[0];
  return `Valeurs rangées : ${sorted.join(', ')}. La valeur <strong>${mode}</strong> apparaît ${Stats.count(data, mode)} fois, plus que toutes les autres.`;
}

const QUESTION = {
  mean: 'Quelle est la <u>moyenne</u> de cette série ? <small>(arrondie au dixième)</small>',
  median: 'Quelle est la <u>médiane</u> de cette série ?',
  mode: 'Quel est le <u>mode</u> de cette série ?',
};

function initGame() {
  new GameShell(document.getElementById('game'), {
    id: 'moyenne',
    title: 'Défi du calcul',
    rounds: 10,
    description: 'Pour chaque série, calcule la valeur demandée et tape ta réponse (la virgule est acceptée pour les décimales).',
    onRound(body, game) {
      const kind = Rand.pick(['mean', 'mean', 'median', 'median', 'mode']);
      const data = makeSeries(kind);
      const truth = kind === 'mean' ? Stats.mean(data) : kind === 'median' ? Stats.median(data) : Stats.modes(data)[0];

      const input = el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Ta réponse' });
      const btn = el('button', { class: 'btn btn-primary', type: 'submit' }, ['Valider']);
      const hint = el('span', { style: 'color:var(--bad);font-size:.9rem' });
      const form = el('form', { class: 'toolbar' }, [input, btn, hint]);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = parseNum(input.value);
        if (Number.isNaN(val)) { hint.textContent = 'Entre un nombre, par exemple 7,5'; return; }
        input.disabled = btn.disabled = true;
        hint.textContent = '';
        const ok = Math.abs(val - truth) <= (kind === 'mean' ? 0.051 : 1e-9);
        game.answer(ok ? 1 : 0, ok ? 'ok' : 'bad',
          `${ok ? '' : `Tu as répondu ${fmt(val, 3)}. `}${explain(kind, data)}`);
      });

      body.append(
        el('div', { class: 'game-question', html: QUESTION[kind] }),
        el('div', { class: 'numbers' }, data.map((v) => el('span', {}, [String(v)]))),
        form,
      );
      input.focus({ preventScroll: true });
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLab();
  initGame();
});
