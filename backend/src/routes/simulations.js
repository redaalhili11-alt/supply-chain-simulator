const express = require('express');
const Simulation = require('../models/Simulation');
const Decision = require('../models/Decision');
const Result = require('../models/Result');
const SimulationEngine = require('../services/SimulationEngine');
const { authMiddleware } = require('./auth');
const router = express.Router();

const engine = new SimulationEngine();

// Créer une nouvelle simulation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, totalMonths } = req.body;
    const simulation = await Simulation.create(req.user.userId, name, totalMonths || 12);
    res.status(201).json(simulation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lister les simulations de l'utilisateur
router.get('/', authMiddleware, async (req, res) => {
  try {
    const simulations = await Simulation.findByUser(req.user.userId);
    res.json(simulations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir une simulation spécifique avec historique
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) return res.status(404).json({ error: 'Simulation non trouvée' });

    const decisions = await Decision.findBySimulation(req.params.id);
    const results = await Result.findBySimulation(req.params.id);

    res.json({ ...simulation, decisions, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soumettre les décisions d'un mois et simuler
router.post('/:id/decisions', authMiddleware, async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) return res.status(404).json({ error: 'Simulation non trouvée' });
    if (simulation.status === 'completed') return res.status(400).json({ error: 'Simulation terminée' });

    const { decisions } = req.body;
    const currentMonth = simulation.current_month;

    // Sauvegarder les décisions
    await Decision.create(req.params.id, currentMonth, decisions);

    // Récupérer l'état précédent
    const previousResults = await Result.findBySimulation(req.params.id);
    const previousState = previousResults.length > 0 ? previousResults[previousResults.length - 1] : null;

    // Simuler le mois
    const results = engine.simulateMonth(currentMonth, decisions, previousState);

    // Sauvegarder les résultats
    await Result.create(req.params.id, currentMonth, results);

    // Avancer le mois ou terminer
    const isLastMonth = currentMonth >= simulation.total_months;
    if (isLastMonth) {
      await Simulation.complete(req.params.id);
    } else {
      await Simulation.updateMonth(req.params.id, currentMonth + 1);
    }

    res.json({
      month: currentMonth,
      results,
      isLastMonth,
      nextMonth: isLastMonth ? null : currentMonth + 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir le résumé final
router.get('/:id/summary', authMiddleware, async (req, res) => {
  try {
    const results = await Result.findBySimulation(req.params.id);
    const decisions = await Decision.findBySimulation(req.params.id);

    if (results.length === 0) {
      return res.status(400).json({ error: 'Aucun résultat disponible' });
    }

    const score = engine.calculateScore(results);
    const recommendations = engine.generateRecommendations(results, decisions);
    const summary = await Result.getSummary(req.params.id);

    res.json({
      summary,
      score,
      recommendations,
      monthlyResults: results,
      totalMonths: results.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir les fournisseurs disponibles
router.get('/suppliers/list', async (req, res) => {
  try {
    const pool = require('../models/db');
    const result = await pool.query('SELECT * FROM suppliers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
