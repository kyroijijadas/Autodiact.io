import mysql from 'mysql2/promise';

const isHostedRuntime = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const requiredHostedSettings = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingHostedSettings = isHostedRuntime
    ? requiredHostedSettings.filter((setting) => !process.env[setting])
    : [];

if (missingHostedSettings.length > 0) {
    throw new Error(`Missing required database environment variables: ${missingHostedSettings.join(', ')}`);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.DB_NAME || 'AutodidactIo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;