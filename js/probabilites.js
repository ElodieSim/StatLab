/* Module 3 — Probabilités */
'use strict';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const SUMS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
/** Probabilité exacte d'obtenir la somme s avec deux dés. */
const pSum = (s) => (6 - Math.abs(s - 7)) / 36;

/* ---------- Simulateur ---------- */
function initSimulator() {
  const svg = document.getElementById('sim-svg');
  const diceEl = document.getElementById('sim-dice');
  const countEl = document.getElementById('sim-count');
  let counts = {}, total = 0;
  const reset = () => { counts = Object.fromEntries(SUMS.map((s) => [s, 0])); total = 0; };

  const X0 = 50, X1 = 590, Y0 = 20, Y1 = 225, YMAX = 0.3;
  const band = (X1 - X0) / SUMS.length;
  const yOf = (p) => Y1 - (Math.min(p, YMAX) / YMAX) * (Y1 - Y0);

  function render() {
    svg.innerHTML = '';
    for (let p = 0; p <= YMAX + 1e-9; p += 0.05) {
      svgEl('line', { class: 'grid', x1: X0, x2: X1, y1: yOf(p), y2: yOf(p) }, svg);
      svgEl('text', { x: X0 - 8, y: yOf(p) + 4, 'text-anchor': 'end', text: `${Math.round(p * 100)} %` }, svg);
    }
    const pts = [];
    SUMS.forEach((s, i) => {
      const cx = X0 + band * (i + 0.5);
      const f = total ? counts[s] / total : 0;
      if (f > 0) svgEl('rect', { class: 'bar', x: cx - band * 0.35, y: yOf(f), width: band * 0.7, height: Y1 - yOf(f), rx: 3 }, svg);
      svgEl('text', { x: cx, y: Y1 + 20, 'text-anchor': 'middle', text: s }, svg);
      pts.push(`${cx},${yOf(pSum(s))}`);
    });
    svgEl('polyline', { class: 'theo', points: pts.join(' ') }, svg);
    pts.forEach((p) => {
      const [cx, cy] = p.split(',');
      svgEl('circle', { class: 'theo-dot', cx, cy, r: 4 }, svg);
    });
    svgEl('line', { class: 'axis', x1: X0, x2: X1, y1: Y1, y2: Y1 }, svg);
    const f7 = total ? counts[7] / total : 0;
    countEl.textContent = total
      ? `${fmt(total, 0)} lancer${total > 1 ? 's' : ''} · fréquence du 7 : ${fmt(f7 * 100, 1)} % (théorie : 16,7 %)`
      : 'Aucun lancer pour l\'instant';
  }

  function roll(n) {
    let a, b;
    for (let k = 0; k < n; k++) {
      a = Rand.int(1, 6); b = Rand.int(1, 6);
      counts[a + b]++;
      total++;
    }
    diceEl.textContent = `${DICE_FACES[a - 1]} ${DICE_FACES[b - 1]}`;
    diceEl.setAttribute('aria-label', `Dernier lancer : ${a} et ${b}, somme ${a + b}`);
    render();
  }

  document.querySelectorAll('[data-roll]').forEach((btn) => {
    btn.addEventListener('click', () => roll(Number(btn.dataset.roll)));
  });
  document.getElementById('sim-reset').onclick = () => { reset(); render(); };
  reset();
  render();
}

/* ---------- Jeu : le parieur malin ---------- */
const isPrime = (n) => [2, 3, 5, 7, 11].includes(n);
const EVENTS = [
  { label: 'La somme vaut 7', test: (a, b) => a + b === 7 },
  { label: 'La somme vaut 2', test: (a, b) => a + b === 2 },
  { label: 'La somme vaut 12', test: (a, b) => a + b === 12 },
  { label: 'La somme vaut 8', test: (a, b) => a + b === 8 },
  { label: 'La somme vaut 6 ou 8', test: (a, b) => a + b === 6 || a + b === 8 },
  { label: 'On obtient un double', test: (a, b) => a === b },
  { label: 'La somme est paire', test: (a, b) => (a + b) % 2 === 0 },
  { label: 'La somme est supérieure ou égale à 10', test: (a, b) => a + b >= 10 },
  { label: 'La somme est inférieure ou égale à 4', test: (a, b) => a + b <= 4 },
  { label: 'Au moins un des dés affiche 6', test: (a, b) => a === 6 || b === 6 },
  { label: 'Aucun des dés n\'affiche 1', test: (a, b) => a !== 1 && b !== 1 },
  { label: 'Les deux dés sont différents', test: (a, b) => a !== b },
  { label: 'Le produit des deux dés est pair', test: (a, b) => (a * b) % 2 === 0 },
  { label: 'La somme est un nombre premier', test: (a, b) => isPrime(a + b) },
  { label: 'Les deux dés affichent un nombre impair', test: (a, b) => a % 2 === 1 && b % 2 === 1 },
  { label: 'La différence entre les dés vaut 1', test: (a, b) => Math.abs(a - b) === 1 },
].map((e) => {
  let fav = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (e.test(a, b)) fav++;
  return { ...e, fav };
});

const probTxt = (fav) => `${fav}/36 ≈ ${fmt((fav / 36) * 100, 1)} %`;

function pickPair() {
  // Une fois sur quatre environ, on propose deux paris exactement équivalents (piège !).
  const pairs = [];
  for (let i = 0; i < EVENTS.length; i++) {
    for (let j = i + 1; j < EVENTS.length; j++) pairs.push([EVENTS[i], EVENTS[j]]);
  }
  const equal = pairs.filter(([a, b]) => a.fav === b.fav);
  const diff = pairs.filter(([a, b]) => a.fav !== b.fav && Math.abs(a.fav - b.fav) <= 12);
  return Rand.shuffle(Math.random() < 0.25 ? Rand.pick(equal) : Rand.pick(diff));
}

function initGame() {
  new GameShell(document.getElementById('game'), {
    id: 'probabilites',
    title: 'Le parieur malin',
    rounds: 8,
    description: 'Choisis le pari qui a le plus de chances de gagner, ou « autant de chances » s\'ils se valent.',
    onRound(body, game) {
      const [A, B] = pickPair();
      const truth = A.fav > B.fav ? 0 : A.fav < B.fav ? 1 : 2;
      const labels = [`🅰 ${A.label}`, `🅱 ${B.label}`, '⚖️ Autant de chances'];
      const buttons = labels.map((lab, i) => el('button', { class: 'choice', type: 'button', onclick: () => choose(i) }, [lab]));

      function choose(i) {
        buttons.forEach((b, j) => {
          b.disabled = true;
          if (j === truth) b.classList.add('correct');
          else if (j === i) b.classList.add('wrong');
        });
        const ok = i === truth;
        game.answer(ok ? 1 : 0, ok ? 'ok' : 'bad',
          `🅰 « ${A.label} » : ${probTxt(A.fav)}<br>🅱 « ${B.label} » : ${probTxt(B.fav)}<br>` +
          (truth === 2 ? 'Les deux paris ont exactement la même probabilité !' : `Le pari ${truth ? '🅱' : '🅰'} est le plus probable.`));
      }

      body.append(
        el('div', { class: 'game-question' }, ['On lance deux dés. Quel pari choisis-tu ?']),
        el('div', { class: 'choices' }, buttons),
      );
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSimulator();
  initGame();
});
