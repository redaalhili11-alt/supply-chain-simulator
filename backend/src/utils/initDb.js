const pool = require('../models/db');

const initDb = async () => {
  try {
    console.log('🗄️  Initialisation de la base de données...');

    // Création des tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS simulations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        current_month INTEGER DEFAULT 1,
        total_months INTEGER DEFAULT 12,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS monthly_decisions (
        id SERIAL PRIMARY KEY,
        simulation_id INTEGER REFERENCES simulations(id),
        month INTEGER NOT NULL,
        budget_global DECIMAL(15,2),
        objectif VARCHAR(20),
        fournisseur_id INTEGER,
        quantite_commandee INTEGER,
        volume_production INTEGER,
        capacite_utilisee DECIMAL(5,2),
        stock_securite INTEGER,
        politique_reappro VARCHAR(50),
        mode_transport VARCHAR(50),
        reseau_distribution VARCHAR(50),
        prix_unitaire DECIMAL(10,2),
        budget_marketing DECIMAL(15,2),
        promotion_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS monthly_results (
        id SERIAL PRIMARY KEY,
        simulation_id INTEGER REFERENCES simulations(id),
        month INTEGER NOT NULL,
        demande_reelle INTEGER,
        demande_satisfaite INTEGER,
        chiffre_affaires DECIMAL(15,2),
        cout_production DECIMAL(15,2),
        cout_stockage DECIMAL(15,2),
        cout_transport DECIMAL(15,2),
        cout_marketing DECIMAL(15,2),
        cout_total DECIMAL(15,2),
        profit DECIMAL(15,2),
        stock_final INTEGER,
        stock_moyen INTEGER,
        taux_service DECIMAL(5,2),
        delai_moyen DECIMAL(5,2),
        evenement VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100),
        cout_unitaire DECIMAL(10,2),
        delai_moyen INTEGER,
        fiabilite DECIMAL(5,2),
        capacite_max INTEGER
      )
    `);

    // Insertion des fournisseurs par défaut
    await pool.query(`
      INSERT INTO suppliers (nom, cout_unitaire, delai_moyen, fiabilite, capacite_max)
      VALUES 
        ('Fournisseur A (Low Cost)', 8.50, 14, 0.85, 10000),
        ('Fournisseur B (Balanced)', 10.00, 10, 0.92, 8000),
        ('Fournisseur C (Premium)', 12.50, 7, 0.97, 6000)
      ON CONFLICT DO NOTHING
    `);

    // Création des index
    await pool.query('CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_decisions_simulation ON monthly_decisions(simulation_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_results_simulation ON monthly_results(simulation_id)');

    console.log('✅ Base de données initialisée avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de l initialisation:', err);
    throw err;
  }
};

if (require.main === module) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = initDb;

