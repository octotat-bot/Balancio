const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header
 * Attaches user ID to request object for downstream use
 * 
 * Security considerations:
 * - Token must be in "Bearer <token>" format
 * - Token is verified using secret key
 * - Expired tokens are rejected
 * - Invalid tokens are rejected
 */

/**
 * Authenticate JWT token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function authenticate(req, res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user ID to request
        req.userId = decoded.userId;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
}

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @returns {string} - JWT token
 */
function generateToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Token valid for 7 days
    );
}

module.exports = {
    authenticate,
    generateToken
};
