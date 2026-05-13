const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const router = express.Router();

// Route de test pour vérifier que le module auth est chargé
router.get('/', (req, res) => {
  res.json({ message: 'Auth module is running. Use POST /login or POST /register.' });
});

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    res.status(201).json({ user: result.rows[0], message: 'Utilisateur créé' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtenir l'état de jeu
router.get('/state', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT state_data FROM user_states WHERE user_id = $1', [req.user.userId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0].state_data);
    } else {
      res.json({ sims: [], nextId: 1 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sauvegarder l'état de jeu
router.post('/state', authMiddleware, async (req, res) => {
  try {
    const stateData = req.body;
    await pool.query(
      `INSERT INTO user_states (user_id, state_data, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET state_data = $2, updated_at = CURRENT_TIMESTAMP`,
      [req.user.userId, stateData]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, authMiddleware };
