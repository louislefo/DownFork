Tu es un développeur Full-Stack expert en Next.js (App Router), TypeScript, SQLite (via @libsql/client) et intégration d'outils système (FFmpeg, yt-dlp).

Objectif : Reprendre l'application monolithique Next.js de téléchargement de médias et y ajouter un système d'historique complet et bien structuré, incluant la gestion de la suppression des fichiers physiques et des données.

Spécifications techniques additionnelles :

Base de données : Utilise SQLite en direct avec @libsql/client pour stocker l'historique des téléchargements.

Modèle de données : Crée une table downloads contenant : id (string/uuid), title (string), url (string), format (string), fileSize (string), filePath (string), status (string: 'PENDING', 'COMPLETED', 'FAILED'), et createdAt (datetime/ISO string).

API d'Historique : >    * GET /api/downloads : Récupère la liste de tous les téléchargements triés du plus récent au plus ancien.

DELETE /api/downloads/[id] : Supprime définitivement le fichier physique du stockage du serveur (via le module fs de Node.js) ET supprime l'enregistrement de la base de données SQLite.

Mise à jour du processus de téléchargement : Lors d'un téléchargement via POST /api/download, crée d'abord l'enregistrement en statut 'PENDING'. Une fois le fichier final généré par yt-dlp et ffmpeg, met à jour l'enregistrement avec le titre réel, la taille, le chemin du fichier et passe le statut à 'COMPLETED'.

Interface Utilisateur (Frontend) :

Conserve la page principale de téléchargement.

Ajoute une section ou une page dédiée à l'historique sous forme de tableau ou de liste propre et moderne.

Chaque élément de l'historique doit afficher : le titre, le format, la taille, la date, un bouton pour télécharger à nouveau le fichier directement depuis le serveur si le statut est 'COMPLETED', et un bouton rouge "Supprimer".

Lors du clic sur "Supprimer", une confirmation est demandée, puis l'élément disparaît de l'interface après suppression réussie côté serveur.

Livrables attendus :

L'implémentation de la base de données SQLite via @libsql/client (dans lib/db.ts).

Le code des nouvelles routes API (GET et DELETE).

La mise à jour du code de la page principale ou de la nouvelle page d'historique (app/history/page.tsx).

La logique Node.js pour supprimer proprement un fichier du disque dur de manière sécurisée (pour éviter les failles de traversée de chemin).

Code de manière propre, robuste, typée et sans utiliser d'emojis.