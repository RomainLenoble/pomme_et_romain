# Configurer la liste de mariage (Firebase)

Le site reste 100% hébergé sur GitHub Pages. Firebase ne sert qu'à stocker
les montants déjà réunis pour chaque cadeau, gratuitement, sans serveur à
gérer de votre côté.

## 1. Créer un projet Firebase

1. Allez sur https://console.firebase.google.com
2. "Ajouter un projet" → donnez-lui un nom (ex. `pomme-romain-mariage`)
3. Vous pouvez désactiver Google Analytics, il n'est pas nécessaire.

## 2. Créer une base Firestore

1. Dans le menu de gauche : **Build → Firestore Database**
2. "Créer une base de données"
3. Choisissez une région proche (ex. `eur3 (europe-west)`)
4. Démarrez **en mode production** (on configure les règles nous-mêmes à
   l'étape 4).

## 3. Récupérer la configuration du site web

1. Dans les paramètres du projet (icône ⚙️ en haut à gauche) → **Vos
   applications** → cliquez sur l'icône `</>` pour ajouter une appli web.
2. Donnez-lui un nom (ex. `site mariage`), pas besoin de Firebase Hosting.
3. Firebase vous montre un objet `firebaseConfig`. Copiez-le et collez-le
   dans `script.js`, en remplaçant le bloc qui commence par :
   ```js
   const firebaseConfig = {
       apiKey: "REMPLACER_MOI",
       ...
   ```

## 4. Sécuriser les règles Firestore

Toujours dans Firestore → onglet **Règles**, remplacez le contenu par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cadeaux/{giftId} {
      allow read: if true;
      allow create: if false;
      allow delete: if false;
      allow update: if
        request.resource.data.keys().hasOnly(['raised']) &&
        request.resource.data.raised is number &&
        request.resource.data.raised > resource.data.raised &&
        request.resource.data.raised <= resource.data.raised + 100000;
    }
  }
}
```

Ces règles :
- laissent tout le monde **lire** les montants (nécessaire pour afficher
  la liste),
- interdisent la création/suppression de documents depuis le site (vous
  les créez vous-même, voir étape 5),
- n'autorisent que d'**augmenter** le champ `raised`, d'un montant
  raisonnable à la fois — personne ne peut remettre un cadeau à zéro ou
  changer autre chose.

Cliquez sur **Publier**.

## 5. Créer un document par cadeau

Dans Firestore → onglet **Données** :

1. "Démarrer une collection" → identifiant : `cadeaux`
2. Pour chaque cadeau défini dans `script.js` (le tableau `GIFTS`), créez
   un document dont l'**ID** correspond exactement à l'`id` du cadeau
   (ex. `velo`, `lune-de-miel`, `cuisine`), avec un seul champ :
   - Nom du champ : `raised`
   - Type : `number`
   - Valeur : `0`

## 6. Adapter la liste de cadeaux

Ouvrez `script.js` et modifiez le tableau `GIFTS` en haut du fichier pour
mettre vos propres cadeaux (nom, description, objectif en euros — ou
`null` pour une cagnotte libre sans objectif affiché). N'oubliez pas de
créer le document Firestore correspondant à chaque nouvel `id` (étape 5).

## 7. Publier

Commitez `index.html`, `style.css` et `script.js` sur votre dépôt GitHub
comme d'habitude. GitHub Pages sert les fichiers statiques, et le
navigateur de chaque invité communique directement avec Firestore pour
lire et mettre à jour les montants — aucune configuration supplémentaire
côté GitHub n'est nécessaire.

Astuce : Firestore a une lecture/écriture en temps réel, donc si deux
invités regardent la page en même temps, ils verront les montants se
mettre à jour automatiquement, sans recharger la page.
