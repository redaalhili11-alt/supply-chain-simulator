const pool = require('./db');

class Result {
  static async create(simulationId, month, results) {
    const query = `
      INSERT INTO monthly_results (
        simulation_id, month, demande_reelle, demande_satisfaite,
        chiffre_affaires, cout_production, cout_stockage, cout_transport,
        cout_marketing, cout_total, profit, stock_final, stock_moyen,
        taux_service, delai_moyen, evenement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const values = [
      simulationId, month,
      results.demandeReelle,
      results.demandeSatisfaite,
      results.chiffreAffaires,
      results.coutProduction,
      results.coutStockage,
      results.coutTransport,
      results.coutMarketing,
      results.coutTotal,
      results.profit,
      results.stockFinal,
      results.stockMoyen,
      results.tauxService,
      results.delaiMoyen,
      results.evenement
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findBySimulation(simulationId) {
    const query = 'SELECT * FROM monthly_results WHERE simulation_id = $1 ORDER BY month';
    const result = await pool.query(query, [simulationId]);
    return result.rows;
  }

  static async getSummary(simulationId) {
    const query = `
      SELECT 
        SUM(chiffre_affaires) as total_ca,
        SUM(cout_total) as total_couts,
        SUM(profit) as total_profit,
        AVG(taux_service) as avg_service,
        AVG(stock_moyen) as avg_stock,
        COUNT(*) as months_completed
      FROM monthly_results 
      WHERE simulation_id = $1
    `;
    const result = await pool.query(query, [simulationId]);
    return result.rows[0];
  }
}

module.exports = Result;
