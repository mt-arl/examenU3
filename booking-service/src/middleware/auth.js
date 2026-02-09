const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and extract user info
 * Adds user info to request object
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token not provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
}

/**
 * Extract user from GraphQL context
 * Requires token to be in Authorization header
 */
function extractUserFromRequest(req) {
    const authHeader = req.headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (err) {
        return null;
    }
}

module.exports = { verifyToken, extractUserFromRequest };
