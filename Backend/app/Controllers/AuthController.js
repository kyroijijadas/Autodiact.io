import bcrypt from 'bcrypt';
import User from '../Models/User.js';
import jwt from 'jsonwebtoken';

const accessCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
};

export default class AuthController {
    // POST /api/register
    static async register(req, res) {
        try {
            const { username, password } = req.body ?? {};
            const normalizedUsername = typeof username === 'string' ? username.trim() : '';

            if (!normalizedUsername || typeof password !== 'string') {
                return res.status(400).json({ error: 'Username and password are required' });
            }
            if (normalizedUsername.length > 50) {
                return res.status(400).json({ error: 'Username must be 50 characters or fewer' });
            }
            if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
                return res.status(400).json({ error: 'Password must be at least 8 characters and no more than 72 bytes' });
            }

            const existingUser = await User.findByUsername(normalizedUsername);
            if (existingUser) {
                return res.status(409).json({ error: 'Username already taken' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            // Public registration always creates a student; clients cannot grant themselves roles.
            const newUserId = await User.create(normalizedUsername, hashedPassword, 'student');

            res.status(201).json({
                message: 'Registration successful!',
                userId: newUserId
            });
        } catch (error) {
            console.error(error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Username already taken' });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/login
    static async login(req, res) {
        try {
            const { username, password } = req.body ?? {};
            const normalizedUsername = typeof username === 'string' ? username.trim() : '';

            if (!normalizedUsername || typeof password !== 'string') {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            const user = await User.findByUsername(normalizedUsername);
            if (!user || !Boolean(user.is_active)) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not configured');
                return res.status(500).json({ error: 'Authentication is not configured' });
            }

            const token = jwt.sign(
                {
                    sub: String(user.id),
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    algorithm: 'HS256',
                    expiresIn: '15m'
                }
            );

            res.cookie('accessToken', token, {
                ...accessCookieOptions,
                maxAge: 15 * 60 * 1000
            });

            res.status(200).json({
                message: 'Login successful!',
                user: { id: user.id, username: user.username, role: user.role }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async logout(req, res) {
        res.clearCookie('accessToken', accessCookieOptions);
        res.status(200).json({ message: 'Logout successful' });
    }

    static async getCurrentUser(req, res) {
        try {
            const user = await User.findPublicById(req.auth.userId);
            if (!user) {
                res.clearCookie('accessToken', accessCookieOptions);
                return res.status(401).json({ error: 'Authentication required' });
            }
            res.status(200).json({ user });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    }
}
