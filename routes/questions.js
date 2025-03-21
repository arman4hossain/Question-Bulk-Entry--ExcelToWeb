const express = require("express");
const multer = require("multer");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const fs = require("fs");
const csv = require("csv-parser");

const router = express.Router();

// CSV Process
const upload = multer({ dest: "uploads/" });

router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
    if (!req.file) {
        console.error("❌ No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const questions = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
            questions.push([
                row.qserial, row.classname, row.subject, row.chapter, row.topic, row.ques,
                row.option_a, row.option_b, row.option_c, row.option_d, row.answer
            ]);
        })
        .on("end", async () => {
            const client = await pool.connect();
            try {
                console.log("🛠 Starting Transaction...");
                await client.query("BEGIN");

                for (const question of questions) {
                    console.log("🛠 Inserting:", question);
                    await client.query(
                        `INSERT INTO questions (qserial, classname, subject, chapter, topic, ques, option_a, option_b, option_c, option_d, answer)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        question
                    );
                }

                await client.query("COMMIT");
                console.log("✅ CSV Data Successfully Inserted!");
                res.json({ message: "CSV uploaded successfully!" });

            } catch (err) {
                console.error("❌ Error saving data:", err);
                await client.query("ROLLBACK");
                res.status(500).json({ message: "Database transaction failed" });
            } finally {
                client.release();
                fs.unlinkSync(filePath);
            }
        });
});

// Total Add
router.get("/", authMiddleware, async (req, res) => {
    try {
        const questions = await pool.query("SELECT * FROM questions");
        res.json(questions.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Single Add
router.post("/", authMiddleware, async (req, res) => {
    const { qserial, classname, subject, chapter, topic, ques, option_a, option_b, option_c, option_d, answer } = req.body;

    try {
        const newQuestion = await pool.query(
            `INSERT INTO questions (qserial, classname, subject, chapter, topic, ques, option_a, option_b, option_c, option_d, answer) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [qserial, classname, subject, chapter, topic, ques, option_a, option_b, option_c, option_d, answer]
        );

        res.json(newQuestion.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
