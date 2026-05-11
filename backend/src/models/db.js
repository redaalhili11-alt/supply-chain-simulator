const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback aux variables individuelles pour le dev local si DATABASE_URL n'est pas défini
  ...(process.env.DATABASE_URL ? {} : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le client PostgreSQL', err);
  process.exit(-1);
});

module.exports = pool;
