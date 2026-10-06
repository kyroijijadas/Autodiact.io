 import bcrypt from 'bcrypt';
 import User from '../Models/User.js';

 export default class AuthController {
    // POST /api/register
    static async register(req, res) {
        try {
            // Express automatically parses the JSON body (replaces php://input)
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }

            // 1. Check if user already exists
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.status(409).json({ error: "Username already taken" });
            }

            // 2. Hash the password (10 salt rounds is standard)
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Save to database
            const newUserId = await User.create(username, hashedPassword);

            res.status(201).json({ 
                message: "Registration successful!", 
                userId: newUserId 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // POST /api/login
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }

            // 1. Find user in the database
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: "Invalid username or password" });
            }

            // 2. Compare the plain password with the hashed password in DB
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ error: "Invalid username or password" });
            }

            res.status(200).json({ 
                message: "Login successful!", 
                username: user.username 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
 }

