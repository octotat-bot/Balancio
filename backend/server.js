require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');

// Import expense controller for group expenses route
const expenseController = require('./controllers/expenseController');
const { authenticate } = require('./middleware/auth');

const app = express();

/**
 * MIDDLEWARE
 */
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

/**
 * ROUTES
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        name: 'Balancio API',
        message: 'Welcome to Balancio - Split Expense Management API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            groups: '/api/groups',
            expenses: '/api/expenses',
            notifications: '/api/notifications'
        },
        documentation: 'https://github.com/octotat-bot/Balancio'
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', require('./routes/notifications'));

// Group expenses route (nested under groups)
app.get('/api/groups/:groupId/expenses', authenticate, expenseController.getExpenses);

/**
 * ERROR HANDLING
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

/**
 * DATABASE CONNECTION
 */
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('✓ Connected to MongoDB');
    })
    .catch((error) => {
        console.error('✗ MongoDB connection error:', error);
        process.exit(1);
    });

/**
 * START SERVER
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
