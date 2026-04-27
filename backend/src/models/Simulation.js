const pool = require('./db');

class Simulation {
  static async create(userId, name, totalMonths = 12) {
    const query = `
      INSERT INTO simulations (user_id, name, total_months)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, name, totalMonths]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM simulations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUser(userId) {
    const query = 'SELECT * FROM simulations WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async updateMonth(id, month) {
    const query = `
      UPDATE simulations 
      SET current_month = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [month, id]);
    return result.rows[0];
  }

  static async complete(id) {
    const query = `
      UPDATE simulations 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Simulation;
