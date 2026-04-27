# Guide de Déploiement — Supply Chain Simulator

Ce projet est composé d'un frontend React, d'un backend Node.js et d'une base de données PostgreSQL.

## 🐳 Option A : Déploiement avec Docker (Le plus simple)

### Prérequis
- Docker et Docker Compose installés sur votre machine/serveur.

### Étapes
1. Ouvrez un terminal à la racine du projet.
2. Lancez la commande suivante :
   ```bash
   docker-compose up -d --build
   ```
3. L'application sera accessible sur :
   - **Frontend** : `http://localhost:3000`
   - **Backend API** : `http://localhost:3001/api`
   - **Santé de l'API** : `http://localhost:3001/api/health`

---

## 🛠️ Option B : Déploiement Manuel

### 1. Base de données (PostgreSQL)
- Installez PostgreSQL.
- Créez une base de données nommée `supply_chain_sim`.
- Configurez l'utilisateur et le mot de passe (par défaut `postgres` / `password` dans le code).

### 2. Backend (API Node.js)
- Allez dans le dossier `backend` : `cd backend`
- Installez les dépendances : `npm install`
- Vérifiez/Modifiez le fichier `.env` avec vos accès DB.
- **Initialisez la base de données** (création des tables) :
  ```bash
  npm run init-db
  ```
- Lancez le serveur :
  ```bash
  npm start
  ```

### 3. Frontend (React)
- Allez dans le dossier `frontend` : `cd frontend`
- Installez les dépendances : `npm install`
- Créez le build de production :
  ```bash
  npm run build
  ```
- Le dossier `dist` généré contient les fichiers statiques à héberger (sur Nginx, Apache, Vercel, ou S3).

---

## 🔐 Sécurité & Variables d'Environnement

Assurez-vous de configurer ces variables dans votre environnement de production (ou via le fichier `.env`) :

| Variable | Description | Exemple |
| --- | --- | --- |
| `PORT` | Port du backend | `3001` |
| `DB_HOST` | Hôte de la base de données | `localhost` |
| `DB_NAME` | Nom de la base | `supply_chain_sim` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `votre_password` |
| `JWT_SECRET` | Clé secrète pour les tokens | `une_cle_tres_securisee` |

## 📁 Structure des fichiers
- `/frontend` : Code source React (Vite).
- `/backend` : API Express et logique métier.
- `/docker-compose.yml` : Orchestration des conteneurs.
