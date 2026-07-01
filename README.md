# Projet final DevSecOps — Industrialisation, durcissement et architecture CI/CD

## 1. Contexte du projet

Ce dépôt contient une application composée de deux parties :

* **Frontend** (`public/`) : une interface web statique (HTML) qui consomme l'API.
* **Backend** (`src/`) : une API REST en Node.js / Express, manipulant des données sensibles (clés d'API, accès à des infrastructures externes).

L'objectif du projet n'est pas de développer ces deux briques, mais de construire **autour d'elles** une chaîne CI/CD industrialisée et durcie : gouvernance Git stricte, sécurité appliquée le plus tôt possible dans le cycle de développement (Shift Left), gestion chiffrée des secrets, conteneurisation scannée, pipeline GitHub Actions avec contrôles bloquants, puis déploiement automatisé (frontend sur GitHub Pages, backend sur Vercel).

Ce README documente, bloc par bloc, ce qui a été mis en place. Il est mis à jour au fur et à mesure de l'avancement du projet.

## 2. Architecture actuelle du dépôt

```
.
├── public/                      # Frontend statique (HTML)
├── src/
│   └── app.js                   # API Express (backend)
├── tests/
│   ├── unit.test.js
│   ├── integration.test.js
│   └── e2e.test.js
├── git_hooks/
│   └── pre-commit               # Copie versionnée du hook de sécurité local
├── gitleaks.toml                # Règles de détection de secrets (locales + CI)
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # Pipeline CI/CD principal
├── .gitignore
├── package.json
└── package-lock.json
```

> **Point de vigilance pour la suite du projet :** le sujet demande explicitement des dossiers `/frontend` et `/backend` (notamment pour y placer le `Dockerfile` du backend et filtrer les déclenchements CI par chemin). La structure actuelle (`public/` + `src/`) correspond au squelette de départ fourni par l'équipe de développement ; une réorganisation en `/frontend` et `/backend` est à prévoir au Bloc 4 (Conteneurisation).

## 3. Gouvernance Git — Bloc 1 ✅

### Principe

Le code de production doit être **techniquement validé** avant tout déploiement, pas seulement par convention orale. Deux mécanismes GitHub imposent cette règle :

* La **branch protection** sur `main`, qui interdit tout push direct et impose de passer par une Pull Request.
* Un **GitHub Environment** nommé `production`, qui isole les secrets de déploiement et peut restreindre les déploiements à une branche précise.

### Ce qui a été mis en place

* **Branches** :
  * `staging` — branche pivot de développement et d'intégration. Toute la CI s'y exécute à chaque push.
  * `main` — branche de production, protégée.
* **Règle de protection sur `main`** (`Settings > Branches`) :
  * Pull Request obligatoire avant tout merge (push direct refusé)
  * Status checks requis avant de pouvoir merger
  * Règles non contournables, y compris pour les administrateurs
  * Nombre de reviews requises ajusté selon la taille de l'équipe sur le projet (0 en solo, 1 dès qu'un collaborateur avec accès en écriture est disponible)
* **Environment `production`** (`Settings > Environments`) créé, destiné à recevoir les secrets de déploiement des blocs suivants (SOPS, Vercel).
* **Squelette du workflow** `.github/workflows/ci-cd.yml` :
  * Déclenché sur `push` vers `staging` et `main`
  * `permissions: contents: read` au niveau global (moindre privilège)
  * Job `deploy-backend` conditionné par `if: github.ref == 'refs/heads/main'`, dépendant du job `test` via `needs`, et rattaché à `environment: production`

Ce squelette sera complété progressivement dans les blocs suivants (tests réels, scans de sécurité, déploiement effectif).

## 4. Sécurité locale — Shift Left — Bloc 2 ✅

### Principe

Le Shift Left consiste à déplacer les contrôles de sécurité le plus tôt possible dans le cycle de développement — idéalement avant même le commit — plutôt que de découvrir un problème en CI ou en production. Un hook Git local (`pre-commit`) permet de bloquer un commit dangereux avant qu'il n'atteigne GitHub.

### Ce qui a été mis en place

Le hook `pre-commit` valide séquentiellement trois contrôles avant d'autoriser un commit :

1. **`actionlint`** sur l'ensemble des fichiers de `.github/workflows/` — vérifie la syntaxe des workflows GitHub Actions.
2. **`gitleaks`** en mode `--staged` — scanne uniquement les fichiers déjà ajoutés à l'index (`git add`), à la recherche de secrets, en s'appuyant sur `gitleaks.toml`.
3. **Blocage par extension** — si un fichier `.env`, `.pem` ou `.key` est détecté parmi les fichiers stagés, le commit est immédiatement annulé avec un message d'erreur explicite.

Si l'un de ces contrôles échoue, le commit est refusé (`exit 1`) ; sinon il est autorisé (`exit 0`).

### Règle de détection personnalisée (`gitleaks.toml`)

En plus des règles par défaut de gitleaks (`useDefault = true`), une règle personnalisée détecte les jetons internes de l'entreprise au format `SECWALLET_` suivi de 24 caractères alphanumériques majuscules, avec une vérification d'entropie pour limiter les faux positifs.

### Installation du hook (obligatoire pour chaque contributeur)

Le dossier `.git/hooks/` n'est jamais envoyé sur GitHub (il n'est pas suivi par Git). Une copie du script est donc versionnée dans `git_hooks/pre-commit` : à chaque clonage du dépôt, il faut l'installer manuellement :

```bash
cp git_hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Sans cette étape, les commits ne seront pas contrôlés localement (les contrôles resteront actifs en CI, mais plus tardivement).

## 5. Installation et utilisation de l'application

### Prérequis

Node.js (version 22 ou supérieure).

### Installation des dépendances

```bash
npm ci
```

### Exécution des tests

```bash
npm test
```

### Démarrage de l'application

```bash
npm start
```

L'application est accessible sur `http://localhost:3000`.

## 6. Avancement du projet

- [x] **Bloc 1** — Gouvernance Git (branches, branch protection, environment `production`, squelette du workflow)
- [x] **Bloc 2** — Sécurité locale / Shift Left (hook pre-commit, règles gitleaks personnalisées)
- [ ] **Bloc 3** — Gestion des secrets par enveloppe (age + SOPS)
- [ ] **Bloc 4** — Conteneurisation du backend (Dockerfile multi-stage, SBOM, scan Trivy)
- [ ] **Bloc 5** — Composite Action Trivy (analyse SBOM réutilisable)
- [ ] **Bloc 6** — Pipeline CI principal durci (permissions, cache, CodeQL, chaînage des jobs)
- [ ] **Bloc 7** — CD Frontend (GitHub Pages via artefacts de déploiement)
- [ ] **Bloc 8** — CD Backend (Vercel + déchiffrement SOPS au runtime)
- [ ] **Bloc 9** — Robustesse (concurrency, healthcheck post-déploiement)
- [ ] **Bloc 10** — Livrables finaux

## 7. Livrables

À déposer sur Moodle en fin de projet : un fichier texte contenant l'URL de production Vercel, l'URL GitHub Pages, et l'URL du dépôt GitHub public, accompagné de tout fichier jugé utile (captures d'écran, scripts).
