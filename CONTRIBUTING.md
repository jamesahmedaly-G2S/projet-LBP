# Contribuer au LBP

## Branches

`<type>/<description-courte-en-kebab-case>`, avec `<type>` pris dans la même
liste que les commits (voir ci-dessous). Exemples déjà utilisés dans ce
dépôt :

- `chore/initialiser-le-monorepo-et-la-structure-du-projet`

La description résume l'objectif de la branche, en français, sans accents ni
majuscules, mots séparés par des tirets.

## Commits — Conventional Commits

Les commits suivent [Conventional Commits](https://www.conventionalcommits.org/fr/)
et sont vérifiés automatiquement par [commitlint](https://commitlint.js.org/)
(`@commitlint/config-conventional`) via un hook Git `commit-msg` (Husky).

```
<type>(<scope optionnel>): <description au présent, sans majuscule initiale, sans point final>
```

Types autorisés : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`,
`ci`, `build`, `style`, `revert`.

Exemples :

```
feat(auth): ajouter l'invitation par email
fix(quiz): corriger le calcul du score sur réponses vides
chore: initialiser le monorepo et la structure du projet
docs(architecture): documenter le découpage feature-based
```

Un commit qui ne respecte pas ce format est rejeté par le hook local avant
même d'atteindre la CI.

## Avant de committer

Les hooks Git (Husky) s'installent automatiquement via `npm install`
(script `prepare`) :

- `pre-commit` : exécute [lint-staged](https://github.com/okonet/lint-staged)
  (ESLint `--fix` puis Prettier `--write`) sur les fichiers indexés.
- `commit-msg` : valide le message de commit avec commitlint.

Ces mêmes vérifications (`npm run lint`, `npm run format:check`) s'exécutent
aussi en CI (voir `.github/workflows/ci.yml`) sur chaque push et pull
request.

## Décisions d'architecture

Toute décision structurante (choix technique, découpage, dépendance
significative) se documente dans `docs/adr/` — voir
[`docs/adr/README.md`](docs/adr/README.md) pour le gabarit.
