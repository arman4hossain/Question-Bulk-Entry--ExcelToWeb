const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const csvUploadRoutes = require('./routes/csvUpload');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const questionsRoute = require('./routes/questions');

const app = express();



app.use(cors());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/csv', csvUploadRoutes);
app.use("/api/users", userRoutes); 
app.use('/api', questionsRoute);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
