const express = require('express');
const Result = require('../models/Result');
const { authMiddleware } = require('./auth');
const router = express.Router();

// Exporter les résultats en CSV
router.get('/:id/csv', authMiddleware, async (req, res) => {
  try {
    const results = await Result.findBySimulation(req.params.id);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Aucun résultat à exporter' });
    }

    // En-têtes CSV
    const headers = [
      'Mois', 'Demande Réelle', 'Demande Satisfaite', "Chiffre d'affaires",
      'Coût Production', 'Coût Stockage', 'Coût Transport', 'Coût Marketing',
      'Coût Total', 'Profit', 'Stock Final', 'Stock Moyen',
      'Taux de Service (%)', 'Délai Moyen (jours)', 'Événement'
    ];

    // Lignes de données
    const rows = results.map(r => [
      r.month, r.demande_reelle, r.demande_satisfaite, r.chiffre_affaires,
      r.cout_production, r.cout_stockage, r.cout_transport, r.cout_marketing,
      r.cout_total, r.profit, r.stock_final, r.stock_moyen,
      r.taux_service, r.delai_moyen, r.evenement || 'Aucun'
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=simulation_${req.params.id}_results.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
