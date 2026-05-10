const {
    verifyToken,
} = require('../auth/jwtValidator');

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: 'Missing authorization header',
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Missing token',
            });
        }

        const payload = await verifyToken(token);

        req.user = payload;

        next();
    }
    catch (error) {
        console.error(error);

        return res.status(401).json({
            message: 'Invalid token',
        });
    }
}

module.exports = authMiddleware;