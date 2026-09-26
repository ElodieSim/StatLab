# StatLab — les statistiques de base en jouant

Site web éducatif pour découvrir les notions de base des statistiques grâce à des manipulations interactives et des mini-jeux.

## Les modules

| Module | Notions | Manipulation | Jeu |
|---|---|---|---|
| 1. Moyenne, médiane, mode | tendance centrale, sensibilité aux valeurs extrêmes | points à déplacer sur un axe | *Défi du calcul* : calculer moyenne, médiane ou mode |
| 2. Dispersion | étendue, variance, écart-type | — | *Le plus dispersé* : repérer la série la plus étalée |
| 3. Probabilités | cas favorables / possibles, loi des grands nombres | simulateur de lancers de deux dés | *Le parieur malin* : choisir le pari le plus probable |
| 4. Distributions | histogramme, loi normale, asymétrie | planche de Galton animée | *Moyenne ou médiane ?* : lire la forme d'un histogramme |
| 5. Corrélation | nuage de points, coefficient r, corrélation ≠ causalité | — | *Devine la corrélation* : estimer r au curseur |
| 6. Quiz final | toutes les notions | — | 10 questions tirées parmi 16 |

Les meilleurs scores sont enregistrés dans le navigateur (`localStorage`) et affichés sur la page d'accueil.

## Lancer le site

Le site est entièrement statique (HTML, CSS, JavaScript), sans dépendance ni étape de compilation.

- **Le plus simple** : ouvrir `index.html` dans un navigateur.
- **Avec un petit serveur local** : `python3 -m http.server 8000`, puis ouvrir http://localhost:8000.
- **En ligne avec GitHub Pages** : dans *Settings → Pages* du dépôt, choisir la branche à publier et le dossier `/ (root)`.

## Organisation des fichiers

```
index.html            page d'accueil
moyenne.html …        une page par module
css/style.css         styles communs (thème clair / sombre automatique)
js/common.js          calculs statistiques, hasard, moteur de jeu (GameShell), navigation
js/<module>.js        leçon interactive et jeu de chaque module
```

Pour ajouter une question au quiz, il suffit d'ajouter un objet dans le tableau `QUESTIONS` de `js/quiz.js` (la première réponse est la bonne ; l'ordre est mélangé à l'affichage).
