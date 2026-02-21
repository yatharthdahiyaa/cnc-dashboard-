// server/src/middleware/authMiddleware.js
import dotenv from 'dotenv';
dotenv.config();

/**
 * Bearer token authentication middleware.
 * Reads API_ACCESS_TOKEN from .env and validates the Authorization header.
 *
 * Usage:
 *   app.post('/api/data/push', authMiddleware, handler);
 *
 * Clients must send:
 *   Authorization: Bearer <API_ACCESS_TOKEN>
 */
const authMiddleware = (req, res, next) => {
    const token = process.env.API_ACCESS_TOKEN;

    if (!token) {
        console.error('⚠️  API_ACCESS_TOKEN is not set in .env — refusing all write requests.');
        return res.status(500).json({ error: 'Server misconfiguration: API_ACCESS_TOKEN not set.' });
    }

    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing Authorization header. Use: Authorization: Bearer <token>',
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid Authorization format. Use: Authorization: Bearer <token>',
        });
    }

    const providedToken = parts[1];

    if (providedToken !== token) {
        console.warn(`🚫 Invalid token attempt from ${req.ip}`);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid access token.',
        });
    }

    next();
};

export default authMiddleware;
