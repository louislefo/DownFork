# Plan de Développement : DownFork avec Historique

## Objectif
Reprendre (ou construire de zéro) l'application de téléchargement de médias Next.js, en y intégrant un système d'historique robuste avec Prisma et SQLite. Le système permettra de lancer des téléchargements via `yt-dlp` et `ffmpeg`, de suivre leur état, et de les gérer (consultation, téléchargement depuis le serveur, suppression complète DB + système de fichiers).

## Contexte et Fichiers Clés
- **Base de données :** SQLite (via `schema.prisma`)
- **Backend (API) :**
  - `app/api/download/route.ts` (POST)
  - `app/api/downloads/route.ts` (GET)
  - `app/api/downloads/[id]/route.ts` (DELETE)
- **Frontend :**
  - `app/page.tsx` (Formulaire principal)
  - `app/history/page.tsx` (Tableau de bord de l'historique)
- **Dépendances à ajouter :** `prisma`, `@prisma/client`, `zod` (pour la validation), `lucide-react` (pour les icônes).

## Étapes d'Implémentation

### Phase 1 : Configuration et Base de Données
1. **Initialisation de Prisma :** Installer les dépendances Prisma et initialiser SQLite.
2. **Définition du Modèle :** Créer le modèle `Download` dans `prisma/schema.prisma` :
   - `id` (String/UUID)
   - `title` (String, nullable au départ)
   - `url` (String)
   - `format` (String)
   - `fileSize` (String, nullable)
   - `filePath` (String, nullable)
   - `status` (Enum/String: PENDING, COMPLETED, FAILED)
   - `createdAt` (DateTime)
3. **Génération :** Lancer `npx prisma db push` et générer le client Prisma.
4. **Client Global :** Créer un fichier `lib/db.ts` pour instancier le client Prisma de manière sécurisée pour Next.js (pour éviter les fuites de connexion en dev).

### Phase 2 : Développement de l'API (Backend)
1. **Service de Téléchargement :** Créer un utilitaire `lib/downloader.ts` pour encapsuler les appels `child_process.exec` (ou `spawn`) de `yt-dlp` et `ffmpeg`.
2. **Route POST `/api/download` :**
   - Créer une entrée en base de données avec le statut `PENDING`.
   - Lancer le téléchargement de manière asynchrone (sans bloquer la réponse, ou en utilisant un stream si besoin, mais pour un historique de téléchargement asynchrone, un déclenchement en arrière-plan est préférable).
   - Mettre à jour l'entrée avec les détails et le statut `COMPLETED` ou `FAILED` à la fin.
3. **Route GET `/api/downloads` :**
   - Renvoyer la liste des enregistrements `Download`, triés par date décroissante.
4. **Route DELETE `/api/downloads/[id]` :**
   - Trouver l'enregistrement.
   - Utiliser `fs.promises.unlink` pour supprimer le fichier au chemin `filePath` (avec validation de sécurité pour éviter la traversée de chemin).
   - Supprimer l'entrée en base de données.

### Phase 3 : Interface Utilisateur (Frontend)
1. **Page d'Accueil (`app/page.tsx`) :**
   - Créer un formulaire simple (URL, Format).
   - Au soumission, appeler `POST /api/download` et afficher une confirmation ou rediriger vers l'historique.
2. **Page Historique (`app/history/page.tsx`) :**
   - Récupérer les données via le composant serveur (React Server Components) ou via `fetch` côté client pour une mise à jour en temps réel (ou avec SWR/React Query).
   - Afficher un tableau : Titre, Format, Taille, Date, Statut.
   - Bouton de téléchargement local (lien vers le fichier physique si accessible publiquement, ou via une route API dédiée si stocké hors `/public`).
   - Bouton de suppression avec modal/alerte de confirmation, appelant `DELETE /api/downloads/[id]`.

### Phase 4 : Sécurité et Nettoyage
- S'assurer que les fichiers sont enregistrés dans un dossier spécifique (ex: `public/downloads` ou un dossier hors racine servi par une route API sécurisée).
- Valider que la route de suppression empêche la suppression de fichiers arbitraires (ex: vérifier que le chemin commence bien par le dossier de téléchargement autorisé).

## Tests et Validation
- Tester un téléchargement complet avec succès.
- Vérifier que l'état passe bien de PENDING à COMPLETED.
- Tester un échec (URL invalide) et vérifier le statut FAILED.
- Tester la suppression : le fichier doit disparaître du disque et l'enregistrement de la base de données.
