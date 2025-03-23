// routes/questions.js
const express = require('express');
const pool = require('../db'); // Assuming you have the db setup file
const router = express.Router();

// GET route to fetch all questions
router.get('/questions', async (req, res) => {
  try {
    // Query the database to get all questions
    const result = await pool.query('SELECT * FROM questions'); // Make sure your table is named 'questions'

    // Return the list of questions
    res.json(result.rows); // Assuming you want to return all rows from the questions table
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

module.exports = router;
