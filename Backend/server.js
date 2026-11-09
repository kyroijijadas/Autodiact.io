import './config.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './app/Routes/authRoutes.js';
import quizRoutes from './app/Routes/quizRoutes.js';
import resultRoutes from './app/Routes/resultRoutes.js';
import adminRoutes from './app/Routes/adminRoutes.js';
import professorApplicationRoutes from './app/Routes/professorApplicationRoutes.js';
import pool from './app/Models/db.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/professor-applications', professorApplicationRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/results', resultRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Autodidact.io Express API is running!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body must contain valid JSON' });
    }
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body is too large' });
    }
    console.error('Unhandled request error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

let server;

async function shutdown() {
    if (!server) {
        await pool.end();
        return;
    }
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
    await pool.query('SELECT 1');
    console.log('Successfully connected to the MySQL database!');
    server = app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
} catch (error) {
    console.error('Unable to connect to the MySQL database:', error.message);
    await pool.end();
    process.exitCode = 1;
}