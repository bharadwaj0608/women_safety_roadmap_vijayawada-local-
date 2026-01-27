const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fullstack-app';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
    })
    .catch((error) => {
        console.log('⚠️  MongoDB connection failed:', error.message);
        console.log('⚠️  Server will run but database operations will fail');
    });

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
