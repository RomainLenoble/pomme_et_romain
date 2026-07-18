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

      match /contributions/{entryId} {
        allow read: if false;
        allow update: if false;
        allow delete: if false;
        allow create: if
          request.resource.data.keys().hasOnly(['amount', 'message', 'createdAt']) &&
          request.resource.data.amount is number &&
          request.resource.data.amount > 0 &&
          request.resource.data.amount <= 100000 &&
          request.resource.data.message is string &&
          request.resource.data.message.size() <= 280;
      }
    }
  }
}
```

Ces règles :
- laissent tout le monde **lire** les montants totaux (nécessaire pour
  afficher la liste publique),
- interdisent la création/suppression/lecture des cadeaux eux-mêmes
  depuis le site (vous créez les documents `cadeaux/{id}` vous-même,
  voir étape 5),
- n'autorisent que d'**augmenter** le champ `raised`, d'un montant
  raisonnable à la fois — personne ne peut remettre un cadeau à zéro ou
  changer autre chose,
- autorisent la création d'une entrée individuelle (`contributions`)
  par participation — mais **personne ne peut lire** ces entrées
  depuis le site public (`allow read: if false`). Seuls vous, en tant
  que propriétaires du projet Firebase, pouvez les consulter dans la
  console (voir section suivante).

Cliquez sur **Publier**.

## 4bis. Voir qui a participé et lire les petits mots

Chaque contribution est aussi enregistrée individuellement (montant +
message éventuel, horodatage), dans une sous-collection, **invisible
depuis le site** — les invités ne voient jamais que le total. Pour la
consulter vous-même :

1. Firestore → onglet **Données**
2. Ouvrez `cadeaux` → cliquez sur un cadeau (ex. `velo`)
3. Vous verrez une sous-collection `contributions` listant chaque
   participation avec son montant, son message et sa date.

C'est le seul endroit où cette information existe — elle n'est reliée à
aucun nom (le formulaire n'en demande pas), donc si vous voulez savoir
*qui* a donné combien, ce sera surtout grâce au message laissé, ou en
recoupant avec ce que les invités vous disent directement.

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
