// server/src/middleware/csrfMiddleware.js
/**
 * Lightweight CSRF protection for browser-originated requests.
 * Strategy: Double-Submit Cookie pattern.
 * - Server sets a random `csrf-token` cookie on first GET
 * - Browser must echo it back as `X-CSRF-Token` header on all writes
 * - API clients (Python scripts) bypass this by sending the Bearer token
 *   (machine-to-machine calls don't have cookies, so they're exempt)
 */

import crypto from 'crypto';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Middleware that issues a CSRF token cookie on safe requests
 * and validates it on unsafe (write) requests.
 *
 * Exempt: requests that already carry a valid Bearer token
 * (machine-to-machine API calls from Python/PLCs).
 */
export const csrfMiddleware = (req, res, next) => {
    // Machine-to-machine calls with Bearer token are exempt
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) return next();

    if (SAFE_METHODS.has(req.method)) {
        // Issue token if not already set
        if (!req.cookies?.[CSRF_COOKIE]) {
            const token = crypto.randomBytes(32).toString('hex');
            res.cookie(CSRF_COOKIE, token, {
                httpOnly: false,   // must be readable by JS to echo back
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });
        }
        return next();
    }

    // Validate on write methods
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            error: 'CSRF validation failed',
            message: 'Include the X-CSRF-Token header matching the csrf-token cookie.',
        });
    }

    next();
};
