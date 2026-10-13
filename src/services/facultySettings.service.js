const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const redisClient = require("../config/redis");


// =====================================================
// GET MY PROFILE
// =====================================================

const getMyProfile = async (facultyId) => {

    const faculty = await User.findOne({
        _id: facultyId,
        role: "faculty"
    }).select("-password");

    if (!faculty) {
        throw new Error("Faculty profile not found");
    }

    return faculty;
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePassword = async ({
    facultyId,
    currentPassword,
    newPassword,
    confirmPassword,
    currentToken
}) => {

    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------

    if (!currentPassword) {
        throw new Error("Current password is required");
    }

    if (!newPassword) {
        throw new Error("New password is required");
    }

    if (!confirmPassword) {
        throw new Error("Confirm password is required");
    }


    if (newPassword !== confirmPassword) {
        throw new Error(
            "New password and confirm password do not match"
        );
    }


    if (newPassword.length < 8) {
        throw new Error(
            "New password must be at least 8 characters long"
        );
    }


    // ---------------------------------------------
    // FIND FACULTY
    // ---------------------------------------------

    const faculty = await User.findOne({
        _id: facultyId,
        role: "faculty"
    });

    if (!faculty) {
        throw new Error("Faculty not found");
    }


    // ---------------------------------------------
    // VERIFY CURRENT PASSWORD
    // ---------------------------------------------

    const isPasswordCorrect =
        await bcrypt.compare(
            currentPassword,
            faculty.password
        );

    if (!isPasswordCorrect) {
        throw new Error(
            "Current password is incorrect"
        );
    }


    // ---------------------------------------------
    // CHECK SAME PASSWORD
    // ---------------------------------------------

    const isSamePassword =
        await bcrypt.compare(
            newPassword,
            faculty.password
        );

    if (isSamePassword) {
        throw new Error(
            "New password must be different from current password"
        );
    }


    // ---------------------------------------------
    // HASH NEW PASSWORD
    // ---------------------------------------------

    const hashedPassword =
        await bcrypt.hash(
            newPassword,
            12
        );


    faculty.password = hashedPassword;

    await faculty.save();


    // ---------------------------------------------
    // INVALIDATE CURRENT JWT
    // ---------------------------------------------

    if (currentToken) {

        try {

            const decoded =
                jwt.verify(
                    currentToken,
                    process.env.JWT_SECRET_KEY
                );

            const currentTime =
                Math.floor(Date.now() / 1000);

            const remainingTime =
                decoded.exp - currentTime;


            if (remainingTime > 0) {

                await redisClient.set(
                    `blacklist:${currentToken}`,
                    "true",
                    {
                        EX: remainingTime
                    }
                );

            }

        } catch (error) {

            // Token is already invalid/expired.
            // Password has already been changed,
            // so we don't need to fail the operation.
        }
    }


    return true;
};


// =====================================================
// LOGOUT
// =====================================================

const logout = async (token) => {

    if (!token) {
        throw new Error(
            "Authentication token not found"
        );
    }


    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET_KEY
            );

        const currentTime =
            Math.floor(Date.now() / 1000);

        const remainingTime =
            decoded.exp - currentTime;


        if (remainingTime > 0) {

            await redisClient.set(
                `blacklist:${token}`,
                "true",
                {
                    EX: remainingTime
                }
            );

        }

    } catch (error) {

        // Token is already invalid or expired.
        // Nothing else needs to be done.
    }


    return true;
};


module.exports = {
    getMyProfile,
    changePassword,
    logout
};