const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../../middleware/authMiddleware");

const roleMiddleware =
    require("../../middleware/role.middleware");


const {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    closeAttendanceSession,
    markAttendance
} = require("../../controllers/faculty/attendanceSession.controller");


/*
    Faculty creates session
*/
router.post(
    "/",
    authMiddleware,
    roleMiddleware("faculty"),
    createAttendanceSession
);


/*
    Faculty gets own sessions
*/
router.get(
    "/my-sessions",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySessions
);


/*
    Faculty gets one session
*/
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSessionById
);


/*
    Faculty closes session
*/
router.patch(
    "/:id/close",
    authMiddleware,
    roleMiddleware("faculty"),
    closeAttendanceSession
);


/*
    Student marks attendance
*/
router.post(
    "/:id/mark",
    authMiddleware,
    roleMiddleware("student"),
    markAttendance
);


module.exports = router;