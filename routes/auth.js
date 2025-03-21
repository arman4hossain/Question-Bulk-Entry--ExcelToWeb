const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
require("dotenv").config();

const router = express.Router();


router.post(
    "/signup",
    [
        body("name").notEmpty().withMessage("Name is Required"),
        body("email").isEmail().withMessage("invalid Email"),
        body("password").isLength({ min: 6 }).withMessage("Password Must be at least 6 Characters"),
    ],

    async (req, res) => {

        console.log("📥 Incoming Request Body:", req.body);  // 

        
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, email, password, role } = req.body;

        try {
            const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (userExists.rows.length > 0) return res.status(400).json({ message: "User already exists" });

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await pool.query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
                [name, email, hashedPassword, role || "teacher"]
            );

            const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.JWT_SECRET, {
                expiresIn: "1d",
            });

            res.json({ token, user: newUser.rows[0] });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Server error" });
        }
    }
) ;

router.post(
    "/login",
    [
      body("email").isEmail().withMessage("Invalid email"),
      body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
      const { email, password } = req.body;
  
      try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(400).json({ message: "Invalid credentials" });
  
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  
        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET, {
          expiresIn: "1d",
        });
  
        res.json({ token, user: user.rows[0] });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    }
  );
  
  module.exports = router;