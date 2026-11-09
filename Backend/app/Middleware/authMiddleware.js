import jwt from 'jsonwebtoken';
import User from '../Models/User.js';

const accessCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
};

export async function requireAuth(req, res, next) {
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({ error: 'Authentication is not configured' });
    }

    const token = req.cookies?.accessToken;

    if (typeof token !== 'string' || !token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        if (typeof payload !== 'object' || payload === null) {
            res.clearCookie('accessToken', accessCookieOptions);
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        const userId = Number(payload.sub);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.clearCookie('accessToken', accessCookieOptions);
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        const user = await User.findAuthById(userId);
        if (!user || !Boolean(user.is_active)) {
            res.clearCookie('accessToken', accessCookieOptions);
            return res.status(401).json({ error: 'Authentication required' });
        }

        req.auth = {
            userId: user.id,
            role: user.role,
            username: user.username
        };
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.clearCookie('accessToken', accessCookieOptions);
            return res.status(401).json({ error: 'Invalid or expired authentication token' });
        }

        return next(error);
    }
}

export function requireRole(role) {
    return requireAnyRole(role);
}

export function requireAnyRole(...roles) {
    return (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.auth.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}