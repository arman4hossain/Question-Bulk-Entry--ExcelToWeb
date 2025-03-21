const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// Helper function to handle database query for user existence
const findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
};

// Login route
router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
      console.log("Login attempt with email:", email);

      const user = await findUserByEmail(email);

      if (!user) {
          console.log("No user found with that email.");
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          console.log("Password does not match.");
          return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

      console.log("Login successful, returning token...");
      res.json({ token, user });
  } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ message: 'Server error' });
  }
});

// Signup route
router.post('/signup', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name } = req.body;

  try {
      // Check if user already exists
      const userExists = await findUserByEmail(email);
      if (userExists) {
          return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user into the database
      const newUser = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, email, hashedPassword, 'user']
      );

      // Create JWT token
      const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '1d' });

      console.log("New user created and token generated:", newUser.rows[0]);
      res.json({ token, user: newUser.rows[0] });
  } catch (err) {
      console.error("Error during signup:", err);
      res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
