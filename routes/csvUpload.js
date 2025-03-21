const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const csv = require('csv-parser');

const router = express.Router();

// Directory to store uploaded files
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ storage });

// Route to upload CSV and insert data into the database
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];

    // Parse the CSV file
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            // Trim any spaces in the keys and values
            const cleanedData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key.trim(), value?.trim()])
            );

            console.log("Cleaned Data Row:", cleanedData); // Log cleaned row data

            // Create formatted data for each row
            const formattedData = {
                qserial: cleanedData.qserial || null,
                classname: cleanedData.classname || null,
                subject: cleanedData.subject || null,
                chapter: cleanedData.chapter || null,
                topic: cleanedData.topic || null,
                ques: cleanedData.ques || null,
                ques_img: cleanedData.ques_img || null,
                option_a: cleanedData.option_a || null,
                option_a_img: cleanedData.option_a_img || null,
                option_b: cleanedData.option_b || null,
                option_b_img: cleanedData.option_b_img || null,
                option_c: cleanedData.option_c || null,
                option_c_img: cleanedData.option_c_img || null,
                option_d: cleanedData.option_d || null,
                option_d_img: cleanedData.option_d_img || null,
                answer: cleanedData.answer || null,
                explanation: cleanedData.explanation || null,
                explanation_img: cleanedData.explanation_img || null,
                hint: cleanedData.hint || null,
                hint_img: cleanedData.hint_img || null,
                difficulty_level: cleanedData.difficulty_level || null,
                reference: cleanedData.reference || null
            };

            results.push(formattedData);
        })
        .on('end', async () => {
            console.log("Final Results to Insert:", results);

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const row of results) {
                    const query = `
                    INSERT INTO questions 
                    (qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img, 
                     option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer, explanation, 
                     explanation_img, hint, hint_img, difficulty_level, reference) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                `;

                    // Log the data being inserted
                    console.log("Inserting values: ", [
                        row.qserial,
                        row.classname,
                        row.subject,
                        row.chapter,
                        row.topic,
                        row.ques,
                        row.ques_img,
                        row.option_a,
                        row.option_a_img,
                        row.option_b,
                        row.option_b_img,
                        row.option_c,
                        row.option_c_img,
                        row.option_d,
                        row.option_d_img,
                        row.answer,
                        row.explanation,
                        row.explanation_img,
                        row.hint,
                        row.hint_img,
                        row.difficulty_level,
                        row.reference
                    ]);

                    // Execute the insert query
                    await client.query(query, [
                        row.qserial,
                        row.classname,
                        row.subject,
                        row.chapter,
                        row.topic,
                        row.ques,
                        row.ques_img,
                        row.option_a,
                        row.option_a_img,
                        row.option_b,
                        row.option_b_img,
                        row.option_c,
                        row.option_c_img,
                        row.option_d,
                        row.option_d_img,
                        row.answer,
                        row.explanation,
                        row.explanation_img,
                        row.hint,
                        row.hint_img,
                        row.difficulty_level,
                        row.reference
                    ]);
                }
                await client.query('COMMIT');
                res.json({ message: 'CSV data successfully inserted!' });
            } catch (err) {
                await client.query('ROLLBACK');
                console.error("❌ Error saving data:", err);
                res.status(500).json({ message: 'Database transaction failed', error: err.message });
            } finally {
                client.release();
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            }
        });





});

// Get all questions
router.get("/", authMiddleware, async (req, res) => {
    try {
        const questions = await pool.query("SELECT * FROM questions");
        res.json(questions.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
