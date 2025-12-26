const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const profileRoutes = require('./routes/profileRoutes');
const appRoutes = require('./routes/appRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Global Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/app', appRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('YouAndMe Backend API is running');
});

module.exports = app;
