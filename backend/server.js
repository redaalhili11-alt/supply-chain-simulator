const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const simulationRoutes = require('./src/routes/simulations');
const exportRoutes = require('./src/routes/exports');
const initDb = require('./src/utils/initDb');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialisation de la base de données au démarrage
initDb().catch(err => {
  console.error('Impossible d\'initialiser la base de données au démarrage:', err.message);
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/simulations', simulationRoutes);
app.use('/api/exports', exportRoutes);

// Basic root route to confirm the backend is running.
app.get('/', (req, res) => {
  res.send('Supply Chain Backend Running 🚀');
});

// API index route for quick local checks.
app.get('/api', (req, res) => {
  res.json({ message: 'API working ✅' });
});

// Lightweight health check for local monitoring.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Supply Chain Sim démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
});

module.exports = app;
