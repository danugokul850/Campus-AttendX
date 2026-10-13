const jwt = require("jsonwebtoken");

const authentication = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing",
            });
        }

        // Verify JWT
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        // Store authenticated user information
        req.user = {
            id: payload._id,
            emailId: payload.emailId,
            role: payload.role,
            adminBranch: payload.adminBranch || null
        };

        next();

    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

module.exports = authentication;