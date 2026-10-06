 import pool from './db.js';

 class User {

    // 1. Find a user by username (Used for Login)
    static async findByUsername(username) {
        // The mysql2 package returns an array where the first item contains the rows
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0]; // Return the first matched user, or undefined if not found
    }

    // 2. Create a new user (Used for Registration)
    static async create(username, passwordHash) {
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, passwordHash]
        );
        return result.insertId; // Returns the new user's ID
    }

 }

 export default User;