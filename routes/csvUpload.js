const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const pool = require('../db');


const router = express.Router();


const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


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

// CSV ROute and Insert  DB
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];

    // CSV Read
    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => {
            const formattedData = {
                qserial: data.qserial || null,
                classname: data.classname,
                subject: data.subject,
                chapter: data.chapter,
                topic: data.topic,
                ques: data.ques,
                option_a: data.option_a,
                option_b: data.option_b,
                option_c: data.option_c,
                option_d: data.option_d,
                answer: data.answer,
                explanation: data.explanation || null,
                difficulty_level: data.difficulty_level || null,
                reference: data.reference || null,
            };
            results.push(formattedData);
        })
        .on('end', async () => {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const row of results) {
                    const query = `
                        INSERT INTO questions 
                        (qserial, classname, subject, chapter, topic, ques, option_a, option_b, option_c, option_d, answer, explanation, difficulty_level, reference) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    `;
                    await client.query(query, [
                        row.qserial,
                        row.classname,
                        row.subject,
                        row.chapter,
                        row.topic,
                        row.ques,
                        row.option_a,
                        row.option_b,
                        row.option_c,
                        row.option_d,
                        row.answer,
                        row.explanation,
                        row.difficulty_level,
                        row.reference,
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

module.exports = router;
