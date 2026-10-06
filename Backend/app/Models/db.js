import mysql from 'mysql2/promise';

// Create a connection pool to handle multiple database requests efficiently
const pool = mysql.createPool({
    host: 'db',             // CRITICAL: We use 'db' instead of 'localhost' because Docker networks them by service name!
    user: 'root',
    password: 'rootpassword', // Matches the password in your docker-compose.yml
    database: 'AutodidactIo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection when the server starts
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the Docker MySQL database!');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
    });

export default pool;