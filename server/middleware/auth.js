import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret-change-this';

/**
 * Generate JWT token for user
 */
export function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d' // Token valid for 7 days
    });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Middleware to authenticate requests using JWT or Session
 * Supports both session-based auth (web) and JWT auth (API/mobile)
 */
export function authenticate(req, res, next) {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (decoded) {
            req.user = decoded;
            return next();
        }
    }

    // Check for JWT token in cookie
    const tokenFromCookie = req.cookies.token;
    if (tokenFromCookie) {
        const decoded = verifyToken(tokenFromCookie);
        if (decoded) {
            req.user = decoded;
            return next();
        }
    }

    // Fall back to session-based auth
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    // No valid authentication found
    return res.status(401).json({
        success: false,
        message: 'Authentication required'
    });
}

/**
 * Optional authentication - doesn't fail if not authenticated
 */
export function optionalAuth(req, res, next) {
    // Check JWT first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
        }
    }

    // Check cookie
    const tokenFromCookie = req.cookies.token;
    if (tokenFromCookie && !req.user) {
        const decoded = verifyToken(tokenFromCookie);
        if (decoded) {
            req.user = decoded;
        }
    }

    // Check session
    if (req.session && req.session.user && !req.user) {
        req.user = req.session.user;
    }

    next();
}

/**
 * Middleware to check if user has specific role
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
}

