const pool = require('./db');

class Decision {
  static async create(simulationId, month, decisions) {
    const query = `
      INSERT INTO monthly_decisions (
        simulation_id, month, budget_global, objectif,
        fournisseur_id, quantite_commandee,
        volume_production, capacite_utilisee,
        stock_securite, politique_reappro,
        mode_transport, reseau_distribution,
        prix_unitaire, budget_marketing, promotion_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
      simulationId, month,
      decisions.finance?.budgetGlobal,
      decisions.finance?.objectif,
      decisions.appro?.fournisseurId,
      decisions.appro?.quantiteCommandee,
      decisions.production?.volumeProduction,
      decisions.production?.capaciteUtilisee,
      decisions.stock?.stockSecurite,
      decisions.stock?.politiqueReappro,
      decisions.distribution?.modeTransport,
      decisions.distribution?.reseauDistribution,
      decisions.marketing?.prixUnitaire,
      decisions.marketing?.budgetMarketing,
      decisions.marketing?.promotionActive
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findBySimulation(simulationId) {
    const query = 'SELECT * FROM monthly_decisions WHERE simulation_id = $1 ORDER BY month';
    const result = await pool.query(query, [simulationId]);
    return result.rows;
  }

  static async findByMonth(simulationId, month) {
    const query = 'SELECT * FROM monthly_decisions WHERE simulation_id = $1 AND month = $2';
    const result = await pool.query(query, [simulationId, month]);
    return result.rows[0];
  }
}

module.exports = Decision;
