const jwt = require('jsonwebtoken');
const User = require('../../model/User');

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.query.token;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error verifying admin status' });
    }
};

// Provider middleware - ensures user is a provider
const requireProvider = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findOne({ googleId: userId });

        if (!user || (user.userType !== 'provider' && user.userType !== 'both')) {
            return res.status(403).json({ message: 'Provider access required' });
        }

        req.provider = user;
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error verifying provider status' });
    }
};

module.exports = {
    authenticateJWT,
    requireAdmin,
    requireProvider
};
