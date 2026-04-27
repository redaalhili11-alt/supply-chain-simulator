# 🏭 Supply Chain Simulator

Application web interactive de simulation Supply Chain inspirée de **The Fresh Connection** / **Inchainge**.

## 🎯 Objectif

Simuler la gestion d'une supply chain sur 5 à 12 mois en prenant des décisions stratégiques cross-fonctionnelles :
- **Finance** : Budget, objectifs
- **Approvisionnement** : Choix fournisseurs, quantités
- **Production** : Volume, capacité
- **Stock** : Niveaux de sécurité, politiques
- **Distribution** : Transport, réseau
- **Marketing** : Prix, promotions, budget

## 🏗️ Architecture

```
supply-chain-sim/
├── backend/           # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── models/    # Modèles de données
│   │   ├── routes/    # API REST
│   │   ├── services/  # Moteur de simulation
│   │   └── utils/     # Utilitaires
│   ├── server.js
│   └── package.json
├── frontend/          # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/# Composants React
│   │   ├── pages/     # Pages
│   │   ├── hooks/     # Custom hooks
│   │   └── services/  # API calls
│   └── package.json
└── docker-compose.yml
```

## 🚀 Démarrage Rapide

### Option 1 : Docker (Recommandé)

```bash
# 1. Cloner le projet
cd supply-chain-sim

# 2. Lancer tous les services
docker-compose up -d

# 3. Initialiser la base de données
docker-compose exec backend npm run init-db

# 4. Accéder à l'application
# Frontend : http://localhost:3000
# API : http://localhost:3001/api
```

### Option 2 : Manuel

#### Prérequis
- Node.js 18+
- PostgreSQL 15+

#### Backend
```bash
cd backend
npm install

# Créer la base de données PostgreSQL
createdb supply_chain_sim

# Initialiser les tables
npm run init-db

# Démarrer le serveur
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Fonctionnalités

### Dashboard
- Vue d'ensemble des simulations
- KPIs en temps réel
- Progression visuelle

### Simulation
- **6 modules de décision** avec sliders et inputs
- **Moteur de simulation** avec :
  - Demande aléatoire avec saisonnalité
  - Événements aléatoires (crises, pics de demande)
  - Calculs financiers réalistes
  - Gestion des stocks et ruptures
- **Feedback immédiat** après chaque mois

### Résultats
- Graphiques interactifs (Recharts)
- Tableau détaillé mensuel
- Score global et recommandations
- Export CSV

## 🎮 Logique de Simulation

### Paramètres
- **Demande de base** : 5000 unités/mois
- **Saisonnalité** : Variation mensuelle de ±30%
- **Élasticité prix** : -1.5
- **Événements** : 8 types avec probabilités réalistes

### Formules Clés
```
Demande = Base × Saison × Aléa × ElasticitéPrix × Marketing × Promotion

Profit = CA - (Production + Stockage + Transport + Marketing + Appro)

Taux de Service = Demande Satisfaite / Demande Réelle × 100
```

### Événements Aléatoires
| Événement | Probabilité | Impact |
|-----------|------------|--------|
| Crise fournisseur | 5% | Délai ×2, Coût +30% |
| Pic de demande | 8% | Demande +40% |
| Grève transport | 4% | Transport +50%, Délai +5j |
| Panne machine | 6% | Production -30% |
| Concurrence | 7% | Prix -10% |
| Tendance positive | 10% | Demande +20% |
| Inflation | 6% | Coût +25% |

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Simulations
- `POST /api/simulations` - Créer
- `GET /api/simulations` - Lister
- `GET /api/simulations/:id` - Détails
- `POST /api/simulations/:id/decisions` - Soumettre décisions
- `GET /api/simulations/:id/summary` - Résumé final

### Export
- `GET /api/exports/:id/csv` - Export CSV

## 🗄️ Schéma Base de Données

### Tables Principales
- **users** : Utilisateurs
- **simulations** : Simulations (statut, progression)
- **monthly_decisions** : Décisions par mois
- **monthly_results** : Résultats par mois
- **suppliers** : Référentiel fournisseurs

## 🛠️ Technologies

| Couche | Technologie |
|--------|------------|
| Frontend | React 18, Vite, TailwindCSS, Recharts, Lucide |
| Backend | Node.js, Express, PostgreSQL, JWT |
| DevOps | Docker, Docker Compose |

## 📈 Améliorations Futures

- [ ] Mode multi-joueur (équipes)
- [ ] WebSocket pour temps réel
- [ ] Scénarios prédéfinis
- [ ] Intelligence artificielle (benchmark)
- [ ] Mobile responsive amélioré

## 📝 License

MIT License - Projet éducatif

## 🙏 Inspirations

- [The Fresh Connection](https://inchainge.com/) par Inchainge
- Supply Chain Management - Chopra & Meindl
