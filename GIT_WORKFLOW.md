# Git Workflow - Projet LSTA Academy

## Structure des Branches

```
main (production)
  ↑
develop (branche de développement principale)
  ↑
feat/* (branches de fonctionnalités)
fix/* (branches de corrections de bugs)
```

## Repositories

- **Origin**: `mouadchourak12/insight-bloom-ed-06780-42905-49682-99516`
- **New-repo** (Principal): `abdenour234/Projet_LSTA_Academy` ✅

## Workflow de Développement

### 1. Créer une Nouvelle Fonctionnalité

```bash
# Toujours partir de develop
git checkout develop
git pull new-repo develop

# Créer une nouvelle branche de feature
git checkout -b feat/nom-de-la-fonctionnalite

# Développer et commiter
git add .
git commit -m "feat: description de la fonctionnalité"

# Pousser vers les deux repos
git push origin feat/nom-de-la-fonctionnalite
git push new-repo feat/nom-de-la-fonctionnalite
```

### 2. Merger vers Develop

```bash
# Revenir sur develop
git checkout develop

# Merger la feature
git merge feat/nom-de-la-fonctionnalite --no-ff

# Pousser vers les deux repos
git push origin develop
git push new-repo develop
```

### 3. Release vers Main (Production)

```bash
# Quand develop est stable et testé
git checkout main
git pull new-repo main

# Merger develop dans main
git merge develop --no-ff -m "Release: description de la version"

# Pousser vers les deux repos
git push origin main
git push new-repo main

# Revenir sur develop pour continuer le développement
git checkout develop
```

## Convention de Nommage des Branches

- `feat/nom-feature` - Nouvelles fonctionnalités
- `fix/nom-bug` - Corrections de bugs
- `refactor/nom` - Refactoring de code
- `docs/nom` - Modifications de documentation
- `test/nom` - Ajout ou modification de tests

## Convention de Commits

```
feat: Nouvelle fonctionnalité
fix: Correction de bug
refactor: Refactoring
docs: Documentation
test: Tests
chore: Tâches de maintenance
style: Formatage de code
```

## Branches Actuelles

- ✅ `main` - Branche de production (stable)
- ✅ `develop` - Branche de développement (source de toutes les features)
- ✅ `feat/superadmin-activity-creation` - Mergée dans develop ✓

## Règles Importantes

1. **Ne jamais pousser directement sur `main`**
2. **Toujours créer des branches depuis `develop`**
3. **Tester avant de merger dans `develop`**
4. **Utiliser `--no-ff` pour les merges** (conserve l'historique)
5. **Pousser vers les deux repos** (origin et new-repo)

## Commandes Utiles

```bash
# Voir les branches
git branch -a

# Voir l'état actuel
git status

# Voir l'historique
git log --oneline --graph --all --decorate

# Nettoyer les branches locales supprimées en remote
git fetch --prune

# Supprimer une branche locale
git branch -d nom-branche

# Supprimer une branche remote
git push origin --delete nom-branche
git push new-repo --delete nom-branche
```

## Configuration Actuelle

- Branche principale de développement: **develop** (track new-repo)
- Tous les nouveaux développements partent de **develop**
- **develop** est la source de vérité pour les nouvelles branches
