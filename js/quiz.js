/* Module 6 — Quiz final
   Pour ajouter une question : ajoute un objet à QUESTIONS.
   La première réponse de « choix » est toujours la bonne (l'ordre est mélangé à l'affichage). */
'use strict';

const QUESTIONS = [
  { q: 'Quelle est la moyenne de la série 2, 4, 4, 5, 10 ?',
    choix: ['5', '4', '4,5', '10'],
    exp: '(2 + 4 + 4 + 5 + 10) ÷ 5 = 25 ÷ 5 = 5.' },
  { q: 'Quelle est la médiane de la série 2, 4, 4, 5, 10 ?',
    choix: ['4', '5', '4,5', '3'],
    exp: 'La série est déjà rangée ; la valeur du milieu (la 3e sur 5) est 4.' },
  { q: 'Quel est le mode de la série 1, 3, 3, 6, 6, 6, 8 ?',
    choix: ['6', '3', '8', '4,7'],
    exp: '6 apparaît trois fois, plus que toute autre valeur.' },
  { q: 'Quelle mesure est la moins sensible aux valeurs extrêmes ?',
    choix: ['La médiane', 'La moyenne', 'L\'étendue', 'La somme'],
    exp: 'La médiane ne dépend que de la valeur du milieu : une valeur extrême ne la déplace presque pas.' },
  { q: 'Quelle est l\'étendue de la série 3, 9, 1, 7 ?',
    choix: ['8', '6', '9', '5'],
    exp: 'Étendue = max − min = 9 − 1 = 8.' },
  { q: 'Un écart-type égal à 0 signifie que…',
    choix: ['toutes les valeurs sont identiques', 'la moyenne vaut 0', 'il n\'y a pas de données', 'les données sont très dispersées'],
    exp: 'L\'écart-type mesure l\'écart à la moyenne : s\'il est nul, aucune valeur ne s\'écarte de la moyenne.' },
  { q: 'Deux classes ont la même moyenne. La classe A a un écart-type de 2, la classe B de 6. Que peut-on dire ?',
    choix: ['Les notes de B sont plus étalées', 'La classe B a de meilleures notes', 'La classe A a de meilleures notes', 'Les deux classes sont identiques'],
    exp: 'Même moyenne, donc même « centre » ; mais un écart-type plus grand indique des notes plus dispersées.' },
  { q: 'Quelle est la probabilité d\'obtenir « pile » deux fois de suite avec une pièce équilibrée ?',
    choix: ['1/4', '1/2', '1/3', '2/4'],
    exp: 'Il y a 4 issues équiprobables (PP, PF, FP, FF) et une seule favorable : 1/4.' },
  { q: 'Une pièce équilibrée vient de tomber 5 fois de suite sur « pile ». Probabilité d\'obtenir « face » au prochain lancer ?',
    choix: ['1/2', 'Plus de 1/2', 'Moins de 1/2', '1/6'],
    exp: 'La pièce n\'a pas de mémoire : c\'est toujours 1/2. Croire le contraire, c\'est « l\'erreur du joueur ».' },
  { q: 'Avec deux dés, quelle est la probabilité que la somme vaille 7 ?',
    choix: ['1/6', '1/12', '1/36', '7/36'],
    exp: '6 combinaisons sur 36 donnent 7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1) : 6/36 = 1/6.' },
  { q: 'Si l\'on lance un dé un très grand nombre de fois, la fréquence d\'apparition du 6…',
    choix: ['se rapproche de 1/6', 'devient exactement 1/6 au bout de 6 lancers', 'augmente sans cesse', 'devient imprévisible'],
    exp: 'C\'est la loi des grands nombres : la fréquence observée se rapproche de la probabilité théorique.' },
  { q: 'Dans une distribution étalée vers la droite (comme les salaires), en général…',
    choix: ['la moyenne est supérieure à la médiane', 'la moyenne est inférieure à la médiane', 'la moyenne est égale à la médiane', 'il n\'y a pas de médiane'],
    exp: 'Les quelques très grandes valeurs tirent la moyenne vers le haut, alors que la médiane résiste.' },
  { q: 'Dans une planche de Galton, pourquoi les billes s\'accumulent-elles au centre ?',
    choix: ['Beaucoup plus de chemins mènent au centre qu\'aux bords', 'Les clous du centre sont aimantés', 'Les billes préfèrent aller à droite', 'C\'est une coïncidence'],
    exp: 'Pour atteindre un bord, il faut aller toujours du même côté ; les chemins mélangés, bien plus nombreux, mènent au centre.' },
  { q: 'Un coefficient de corrélation r = −0,9 indique…',
    choix: ['une forte relation décroissante', 'une absence de relation', 'une faible relation croissante', 'une erreur de calcul'],
    exp: 'r proche de −1 : quand une variable augmente, l\'autre diminue, de façon très régulière.' },
  { q: 'Les ventes de glaces et le nombre de noyades sont fortement corrélés. On peut en conclure que…',
    choix: ['un troisième facteur (la chaleur) influence probablement les deux', 'manger une glace provoque des noyades', 'les noyades font vendre des glaces', 'la corrélation est forcément fausse'],
    exp: 'Corrélation n\'est pas causalité : ici, l\'été et la chaleur font augmenter à la fois les ventes de glaces et les baignades.' },
  { q: 'Un coefficient de corrélation est toujours compris entre…',
    choix: ['−1 et 1', '0 et 1', '0 et 100', '−100 et 100'],
    exp: 'Par construction, r varie de −1 (relation décroissante parfaite) à +1 (relation croissante parfaite).' },
];

function initQuiz() {
  let deck = [];
  new GameShell(document.getElementById('game'), {
    id: 'quiz',
    title: 'Quiz final',
    rounds: 10,
    description: '10 questions à choix multiples. Une seule bonne réponse à chaque fois.',
    onRound(body, game) {
      if (game.round === 1) deck = Rand.shuffle(QUESTIONS).slice(0, game.rounds);
      const item = deck[game.round - 1];
      const order = Rand.shuffle(item.choix.map((c, i) => ({ c, good: i === 0 })));
      const buttons = order.map(({ c }, i) => el('button', { class: 'choice', type: 'button', onclick: () => choose(i) }, [c]));

      function choose(i) {
        buttons.forEach((b, j) => {
          b.disabled = true;
          if (order[j].good) b.classList.add('correct');
          else if (j === i) b.classList.add('wrong');
        });
        const ok = order[i].good;
        game.answer(ok ? 1 : 0, ok ? 'ok' : 'bad', item.exp);
      }

      body.append(el('div', { class: 'game-question' }, [item.q]), el('div', { class: 'choices' }, buttons));
    },
  });
}

document.addEventListener('DOMContentLoaded', initQuiz);
