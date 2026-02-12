const supabase = require('../config/supabaseClient');

const extractBearerToken = (authorizationHeader) => {
    if (!authorizationHeader || typeof authorizationHeader !== 'string') {
        return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
        return null;
    }

    return token.trim();
};

const verifyToken = async (req, res, next) => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new Error('Invalid token');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = verifyToken;
