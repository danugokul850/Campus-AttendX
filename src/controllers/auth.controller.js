const validUser = require("../utils/validator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");


// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {
    try {
        // Validate user data
        validUser(req.body);

        // Hash password
        req.body.password = await bcrypt.hash(
            req.body.password,
            10
        );

        const user = await User.create(req.body);

        // Never send password in response
        const { password, ...userResponse } =
            user.toObject();

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: userResponse
        });

    } catch (err) {

        // Duplicate key error
        if (err.code === 11000) {

            const duplicateField =
                Object.keys(err.keyPattern)[0];

            return res.status(409).json({
                success: false,
                message: `${duplicateField} already exists`
            });
        }

        // Mongoose validation error
        if (err.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        console.error("Register error:", err);

        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
    try {

        const { emailId, password } = req.body;

        if (!emailId || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            emailId: emailId.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check whether account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact the administrator."
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // =================================================
        // ACCESS TOKEN
        // =================================================

        const accessToken = jwt.sign(
            {
                _id: user._id,
                emailId: user.emailId,
                role: user.role,

                // Only admin needs adminBranch
                adminBranch:
                    user.role === "admin"
                        ? user.adminBranch
                        : null
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "15m"
            }
        );

        // =================================================
        // REFRESH TOKEN
        // =================================================

        const refreshToken = jwt.sign(
            {
                _id: user._id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Store refresh token in Redis
        await redisClient.set(
            `refreshToken:${user._id}`,
            refreshToken,
            {
                EX: 7 * 24 * 60 * 60
            }
        );

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // =================================================
        // COOKIES
        // =================================================

        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "User login successful"
        });

    } catch (err) {

        console.error("Login error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// LOGOUT
// =====================================================

const logout = async (req, res) => {
    try {

        const {
            token,
            refreshToken: storedRefreshToken
        } = req.cookies;

        if (!token && !storedRefreshToken) {
            return res.status(400).json({
                success: false,
                message: "Already logged out"
            });
        }

        // -------------------------------------------------
        // Block current access token
        // -------------------------------------------------

        if (token) {

            try {

                const payload = jwt.verify(
                    token,
                    process.env.JWT_SECRET_KEY
                );

                if (payload.exp) {

                    await redisClient.set(
                        `token:${token}`,
                        "Blocked",
                        {
                            EXAT: payload.exp
                        }
                    );
                }

            } catch (err) {

                // Access token may already be expired.
                // We can still clear the cookies.
                console.log(
                    "Access token verification during logout:",
                    err.message
                );
            }
        }

        // -------------------------------------------------
        // Revoke refresh token
        // -------------------------------------------------

        if (storedRefreshToken) {

            try {

                const refreshPayload =
                    jwt.verify(
                        storedRefreshToken,
                        process.env.JWT_REFRESH_SECRET
                    );

                await redisClient.del(
                    `refreshToken:${refreshPayload._id}`
                );

            } catch (err) {

                console.log(
                    "Refresh token verification during logout:",
                    err.message
                );
            }
        }

        // Clear cookies
        res.clearCookie("token");
        res.clearCookie("refreshToken");

        return res.status(200).json({
            success: true,
            message: "User logout successful"
        });

    } catch (err) {

        console.error("Logout error:", err);

        res.clearCookie("token");
        res.clearCookie("refreshToken");

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// GET CURRENT USER
// =====================================================

const me = async (req, res) => {
    try {

        // authMiddleware already verified the JWT
        const user = await User.findById(
            req.user.id
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User found successfully",
            user
        });

    } catch (err) {

        console.error("Me error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// REFRESH ACCESS TOKEN
// =====================================================

const refreshToken = async (req, res) => {
    try {

        const {
            refreshToken: storedRefreshToken
        } = req.cookies;

        if (!storedRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is missing"
            });
        }

        // -------------------------------------------------
        // Verify refresh token
        // -------------------------------------------------

        const payload = jwt.verify(
            storedRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // -------------------------------------------------
        // Check Redis
        // -------------------------------------------------

        const storedToken =
            await redisClient.get(
                `refreshToken:${payload._id}`
            );

        if (!storedToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is invalid or expired"
            });
        }

        // Compare Redis token with cookie token
        if (storedToken !== storedRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is invalid"
            });
        }

        // -------------------------------------------------
        // Find user
        // -------------------------------------------------

        const user = await User.findById(
            payload._id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        // -------------------------------------------------
        // Generate NEW access token
        // -------------------------------------------------

        const newAccessToken = jwt.sign(
            {
                _id: user._id,
                emailId: user.emailId,
                role: user.role,

                adminBranch:
                    user.role === "admin"
                        ? user.adminBranch
                        : null
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "15m"
            }
        );

        // Send new access token
        res.cookie(
            "token",
            newAccessToken,
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 15 * 60 * 1000
            }
        );

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully"
        });

    } catch (err) {

        console.error(
            "Refresh token error:",
            err.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePassword = async (req, res) => {
    try {

        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required"
            });
        }

        // Get user from authenticated request
        const user = await User.findById(
            req.user.id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // -------------------------------------------------
        // Verify current password
        // -------------------------------------------------

        const isPasswordCorrect =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // -------------------------------------------------
        // Make sure new password is different
        // -------------------------------------------------

        const isSamePassword =
            await bcrypt.compare(
                newPassword,
                user.password
            );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from old password"
            });
        }

        // -------------------------------------------------
        // Hash new password
        // -------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully. Please login again.",
            requireLogin: true
        });

    } catch (err) {

        console.error(
            "Change password error:",
            err
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    register,
    login,
    logout,
    me,
    refreshToken,
    changePassword
};