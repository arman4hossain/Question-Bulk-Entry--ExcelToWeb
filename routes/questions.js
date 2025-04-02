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

// Update a question by ID
router.put('/questions/:id', async (req, res) => {
    const { id } = req.params;
    const {
        qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
        option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
        explanation, explanation_img, hint, hint_img, difficulty_level, reference
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE questions 
         SET qserial=$1, classname=$2, subject=$3, chapter=$4, topic=$5, ques=$6, ques_img=$7, 
             option_a=$8, option_a_img=$9, option_b=$10, option_b_img=$11, option_c=$12, option_c_img=$13, 
             option_d=$14, option_d_img=$15, answer=$16, explanation=$17, explanation_img=$18, 
             hint=$19, hint_img=$20, difficulty_level=$21, reference=$22 
         WHERE id=$23 RETURNING *`,
            [qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
                option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
                explanation, explanation_img, hint, hint_img, difficulty_level, reference, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.json({ message: "Question updated successfully", question: result.rows[0] });
    } catch (err) {
        console.error('Error updating question:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a question by ID
router.delete('/questions/:id', async (req, res) => {
    const { id } = req.params; // Use 'id' instead of 'qserial'

    try {
        const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING *', [id]); // Delete based on 'id'

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.json({ message: "Question deleted successfully" });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ message: 'Server error' });
    }
});





module.exports = router;
