import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://host-bridge.onrender.com',
            'https://host-bridge.com',
            'https://www.host-bridge.com'
        ];

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow anyway for development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'host-bridge-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Pass io object to routes for real-time features
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Static files - serve from static_html directory
app.use('/static', express.static(join(__dirname, '../static_html')));
app.use('/images', express.static(join(__dirname, '../static_html/images')));
app.use('/css', express.static(join(__dirname, '../static_html/css')));
app.use('/js', express.static(join(__dirname, '../static_html/js')));
app.use('/data', express.static(join(__dirname, '../static_html/data')));
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// API Routes
app.use('/api', authRoutes);
app.use('/api/properties', propertyRoutes);

// Serve HTML files
const htmlFiles = [
    'index.html',
    'login.html',
    'register.html',
    'verify.html',
    'how_operators.html',
    'how_landlords.html',
    'list_property.html',
    'find_property.html',
    'services.html',
    'marketplace_listings.html',
    'legality_map.html',
    'templates_resource.html',
    'property_details.html',
    'reset_password.html',
    'forgotpassword.html',
    'privacypolicy.html'
];

htmlFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => {
        res.sendFile(join(__dirname, '../static_html', file));
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../static_html/index.html'));
});

// Legacy routes for compatibility with old Flask routes
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/index.html');
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 A user connected to sockets');

    socket.on('disconnect', () => {
        console.log('👋 User disconnected');
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Temporarily disable foreign key constraints to avoid sync errors
        await sequelize.query('PRAGMA foreign_keys = OFF');

        // Sync models (alter: true updates tables without dropping)
        await sequelize.sync({ alter: true });

        // Re-enable foreign key constraints
        await sequelize.query('PRAGMA foreign_keys = ON');

        console.log('✅ Database models synchronized');

        // Start listening
        server.listen(PORT, () => {
            console.log('==============================');
            console.log(`✅ Host Bridge server running on http://localhost:${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('==============================');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.error(error);
        process.exit(1);
    }
};

startServer();

