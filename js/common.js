/* ==========================================================
   StatLab — outils communs à toutes les pages
   ========================================================== */
'use strict';

/* ---------- Calculs statistiques ---------- */
const Stats = {
  sum: (a) => a.reduce((s, x) => s + x, 0),
  mean: (a) => Stats.sum(a) / a.length,
  sorted: (a) => [...a].sort((x, y) => x - y),
  median(a) {
    const s = Stats.sorted(a);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  },
  /** Renvoie la liste des modes (valeurs les plus fréquentes). */
  modes(a) {
    const counts = new Map();
    a.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1));
    const max = Math.max(...counts.values());
    return [...counts.entries()].filter(([, c]) => c === max).map(([v]) => v).sort((x, y) => x - y);
  },
  count: (a, v) => a.filter((x) => x === v).length,
  range: (a) => Math.max(...a) - Math.min(...a),
  /** Variance « population » (division par n), la plus simple à expliquer. */
  variance(a) {
    const m = Stats.mean(a);
    return Stats.mean(a.map((x) => (x - m) ** 2));
  },
  sd: (a) => Math.sqrt(Stats.variance(a)),
  correlation(x, y) {
    const mx = Stats.mean(x), my = Stats.mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) {
      sxy += (x[i] - mx) * (y[i] - my);
      sxx += (x[i] - mx) ** 2;
      syy += (y[i] - my) ** 2;
    }
    return sxy / Math.sqrt(sxx * syy);
  },
};

/* ---------- Hasard ---------- */
const Rand = {
  int: (min, max) => min + Math.floor(Math.random() * (max - min + 1)),
  pick: (a) => a[Math.floor(Math.random() * a.length)],
  shuffle(a) {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  },
  /** Loi normale (méthode de Box-Muller). */
  normal(mean = 0, sd = 1) {
    let u = 0;
    while (u === 0) u = Math.random();
    const v = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },
  exponential: (mean) => -mean * Math.log(1 - Math.random()),
};

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Formate un nombre à la française (virgule décimale). */
function fmt(x, digits = 2) {
  return Number(x).toLocaleString('fr-FR', { maximumFractionDigits: digits });
}

/** Lit un nombre saisi par l'utilisateur, en acceptant la virgule. */
function parseNum(str) {
  const s = String(str).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '' || !/^-?\d*\.?\d+$/.test(s)) return NaN;
  return parseFloat(s);
}

/* ---------- Création d'éléments ---------- */
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) e.append(c);
  return e;
}

const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------- Progression (meilleurs scores, stockés dans le navigateur) ---------- */
const Progress = {
  KEY: 'statlab-progress',
  all() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { return {}; }
  },
  best(game) { return this.all()[game]; },
  /** Enregistre le score s'il bat le record. Renvoie true si c'est un nouveau record. */
  save(game, score, max) {
    const all = this.all();
    const prev = all[game];
    const isRecord = !prev || score > prev.score;
    if (isRecord) {
      all[game] = { score, max };
      try { localStorage.setItem(this.KEY, JSON.stringify(all)); } catch (e) { /* stockage indisponible */ }
    }
    return isRecord;
  },
};

/* ---------- Moteur de jeu générique ----------
   Gère les manches, le score, les messages de correction et l'écran de fin.
   Chaque jeu fournit juste onRound(body, game) qui dessine une manche,
   puis appelle game.answer(points, niveau, messageHTML). */
class GameShell {
  constructor(root, opts) {
    Object.assign(this, { rounds: 10, pointsPerRound: 1, description: '' }, opts);
    this.max = this.rounds * this.pointsPerRound;
    this.root = root;
    root.classList.add('game');
    root.innerHTML = '';
    this.statusEl = el('div', { class: 'game-status' });
    this.body = el('div', { class: 'game-body' });
    this.fb = el('div', { class: 'game-feedback', role: 'status', 'aria-live': 'polite' });
    root.append(this.statusEl, this.body, this.fb);
    this.intro();
  }

  intro() {
    const best = Progress.best(this.id);
    this.statusEl.innerHTML = `<span><strong>${this.title}</strong></span><span>${
      best ? `Meilleur score : ${fmt(best.score, 0)} / ${fmt(best.max, 0)}` : 'Pas encore joué'}</span>`;
    this.body.innerHTML = '';
    this.clearFeedback();
    this.body.append(
      el('p', {}, [this.description]),
      el('button', { class: 'btn btn-primary', onclick: () => this.start() }, ['▶ Commencer la partie']),
    );
  }

  start() {
    this.round = 0;
    this.score = 0;
    this.next();
  }

  clearFeedback() {
    this.fb.innerHTML = '';
    this.fb.className = 'game-feedback';
  }

  updateStatus() {
    this.statusEl.innerHTML = `<span>${this.title} — manche <strong>${this.round}</strong> / ${this.rounds}</span>
      <span>Score : <strong>${fmt(this.score, 0)}</strong> / ${fmt(this.max, 0)}</span>`;
  }

  next() {
    this.clearFeedback();
    if (this.round >= this.rounds) return this.end();
    this.round++;
    this.updateStatus();
    this.body.innerHTML = '';
    this.onRound(this.body, this);
  }

  /** niveau : 'ok' | 'mid' | 'bad' */
  answer(points, level, html) {
    this.score += points;
    this.updateStatus();
    const verdict = { ok: 'Bravo !', mid: 'Presque !', bad: 'Raté…' }[level];
    this.fb.className = `game-feedback ${level}`;
    this.fb.innerHTML = '';
    const last = this.round >= this.rounds;
    const btn = el('button', { class: 'btn btn-primary', onclick: () => this.next() },
      [last ? 'Voir mon résultat' : 'Manche suivante →']);
    this.fb.append(
      el('div', { class: 'verdict' }, [verdict]),
      el('div', { html }),
      btn,
    );
    btn.focus({ preventScroll: true });
  }

  end() {
    const score = Math.round(this.score);
    const record = Progress.save(this.id, score, this.max);
    const pct = score / this.max;
    const msg = pct >= 0.9 ? 'Excellent, tu maîtrises cette notion ! 🏆'
      : pct >= 0.6 ? 'Bien joué ! Encore une partie pour viser le sans-faute ?'
        : 'Relis la leçon au-dessus puis retente ta chance, tu vas progresser !';
    this.statusEl.innerHTML = `<span><strong>${this.title}</strong> — partie terminée</span>`;
    this.body.innerHTML = '';
    this.body.append(el('div', { class: 'end-screen' }, [
      el('div', { class: 'big' }, [`${fmt(score, 0)} / ${fmt(this.max, 0)}`]),
      el('p', {}, [msg]),
      record ? el('p', {}, [el('span', { class: 'tag' }, ['Nouveau record !'])]) : '',
      el('button', { class: 'btn btn-primary', onclick: () => this.start() }, ['↻ Rejouer']),
    ]));
  }
}

/* ---------- Navigation commune ---------- */
const MODULES = [
  { id: 'moyenne', href: 'moyenne.html', emoji: '⚖️', titre: 'Moyenne, médiane, mode',
    resume: 'Les trois façons de résumer une série de nombres par une valeur « centrale ».' },
  { id: 'dispersion', href: 'dispersion.html', emoji: '↔️', titre: 'Dispersion',
    resume: 'Étendue et écart-type : les données sont-elles serrées ou étalées ?' },
  { id: 'probabilites', href: 'probabilites.html', emoji: '🎲', titre: 'Probabilités',
    resume: 'Lance des dés virtuels et découvre la loi des grands nombres.' },
  { id: 'distribution', href: 'distribution.html', emoji: '🔔', titre: 'Distributions',
    resume: 'La planche de Galton, la courbe en cloche et les distributions asymétriques.' },
  { id: 'correlation', href: 'correlation.html', emoji: '📈', titre: 'Corrélation',
    resume: 'Deux variables évoluent-elles ensemble ? Devine le coefficient !' },
  { id: 'quiz', href: 'quiz.html', emoji: '🧠', titre: 'Quiz final',
    resume: 'Teste toutes tes connaissances en 10 questions.' },
];

function renderChrome() {
  const current = location.pathname.split('/').pop() || 'index.html';
  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header';
    const nav = el('nav', { class: 'nav', 'aria-label': 'Modules' });
    MODULES.forEach((m) => {
      const a = el('a', { href: m.href }, [m.titre]);
      if (m.href === current) a.setAttribute('aria-current', 'page');
      nav.append(a);
    });
    header.append(el('div', { class: 'container' }, [
      el('a', { class: 'logo', href: 'index.html', html: '📊 Stat<span>Lab</span>' }),
      nav,
    ]));
  }
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.append(el('div', { class: 'container' }, [
      'StatLab — apprendre les statistiques de base en jouant. Tes scores sont enregistrés uniquement dans ce navigateur.',
    ]));
  }
}

document.addEventListener('DOMContentLoaded', renderChrome);
