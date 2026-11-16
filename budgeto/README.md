# Budgeto 💸

Une application web légère pour suivre ses revenus et ses dépenses, directement dans le navigateur.

Aucune installation, aucun serveur, aucune dépendance : uniquement du HTML, du CSS et du JavaScript.

## Fonctionnalités

- Ajout de revenus et de dépenses avec libellé, montant, date et catégorie
- Résumé mensuel : revenus, dépenses et solde
- Graphique en anneau des dépenses par catégorie (SVG, sans bibliothèque)
- Filtre par mois
- Export des transactions du mois en CSV
- Thème clair / sombre
- Données enregistrées localement (`localStorage`) : rien ne quitte votre navigateur
- Interface adaptée au mobile

## Lancer le projet

Clonez le dépôt puis ouvrez `index.html` dans votre navigateur :

```bash
git clone https://github.com/VOTRE-UTILISATEUR/budgeto.git
cd budgeto
```

## Publier sur GitHub Pages

1. Dans le dépôt GitHub, ouvrez **Settings → Pages**.
2. Sous **Source**, choisissez **Deploy from a branch**.
3. Sélectionnez la branche `main` et le dossier `/ (root)`, puis **Save**.
4. Le site sera disponible à l'adresse `https://VOTRE-UTILISATEUR.github.io/budgeto/`.

## Personnalisation

- **Devise** : modifiez la constante `CURRENCY` en haut de `app.js` (par exemple `'USD'`, `'XOF'` ou `'NGN'`).
- **Catégories** : modifiez l'objet `CATEGORIES` dans `app.js`.
- **Couleurs** : modifiez les variables CSS en haut de `style.css`.

## Structure

```
budgeto/
├── index.html   # Structure de la page
├── style.css    # Styles et thèmes
├── app.js       # Logique de l'application
└── README.md
```

## Idées d'amélioration

- Modifier une transaction existante
- Définir un budget par catégorie avec alerte de dépassement
- Importer un fichier CSV
- Graphique d'évolution sur plusieurs mois
