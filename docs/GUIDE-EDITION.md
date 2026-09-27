# Guide d’édition du site X-Sursaut

Le site peut être mis à jour depuis Pages CMS sans modifier de code.

## Connexion

1. Ouvrir <https://app.pagescms.org/>.
2. Choisir **Sign in with GitHub**.
3. Autoriser l’accès au dépôt `x-sursaut/xsursaut-site`.
4. Sélectionner le dépôt puis la branche `main`.

## Modifier une page

Choisir **Page d’accueil**, **Page Présentation**, **Page Équipe**, **Page Contact** ou **Mentions légales**, modifier le texte, puis enregistrer. Pages CMS crée directement un commit GitHub. Cloudflare Pages republie ensuite le site automatiquement.

## Publier une actualité

1. Ouvrir **Actualités** puis choisir **New Actualité**.
2. Saisir le titre, la date et le résumé.
3. Ajouter éventuellement une image de partage.
4. Rédiger le contenu.
5. Activer **Publié**, puis enregistrer.

L’actualité apparaît sur `/actualites/` et dans le flux RSS. Pour préparer un brouillon, laisser **Publié** désactivé.

## Publier un rapport

1. Ouvrir **Rapports** puis choisir **New Rapport**.
2. Saisir le titre, la date, les auteurs et le résumé.
3. Téléverser le PDF dans **Fichier PDF**.
4. Ajouter si nécessaire une présentation détaillée.
5. Activer **Publié**, puis enregistrer.

Le rapport apparaît dans **Publications**. Les PDF et images téléversés sont enregistrés dans `site/public/media/`.

## Vérification et correction

Le déploiement prend généralement une à deux minutes. En cas d’erreur, ouvrir l’historique du fichier sur GitHub pour restaurer une version antérieure, ou demander à l’administrateur du dépôt d’annuler le dernier commit.
