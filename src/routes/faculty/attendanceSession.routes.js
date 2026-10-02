const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/role.middleware");

const {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    getAttendanceSummary,
    closeAttendanceSession,
    markAttendance,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendanceReport
} = require("../../controllers/faculty/attendanceSession.controller");

// ==========================================
// Faculty creates attendance session
// POST /api/attendance-sessions
// ==========================================
router.post(
    "/",
    authMiddleware,
    roleMiddleware("faculty"),
    createAttendanceSession
);

// ==========================================
// Faculty gets own sessions
// GET /api/attendance-sessions/my-sessions
// ==========================================
router.get(
    "/my-sessions",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySessions
);

// ==========================================
// Monthly attendance report
// GET /api/attendance-sessions/reports/monthly
// ==========================================
router.get(
    "/reports/monthly",
    authMiddleware,
    roleMiddleware("faculty"),
    getMonthlyAttendanceReport
);

// ==========================================
// Download monthly attendance report
// GET /api/attendance-sessions/reports/monthly/download
// ==========================================
router.get(
    "/reports/monthly/download",
    authMiddleware,
    roleMiddleware("faculty"),
    downloadMonthlyAttendanceReport
);

// ==========================================
// Faculty gets attendance summary
// GET /api/attendance-sessions/:id/summary
// ==========================================
router.get(
    "/:id/summary",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSummary
);

// ==========================================
// Faculty gets one attendance session
// GET /api/attendance-sessions/:id
// ==========================================
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSessionById
);

// ==========================================
// Faculty manually closes session
// PATCH /api/attendance-sessions/:id/close
// ==========================================
router.patch(
    "/:id/close",
    authMiddleware,
    roleMiddleware("faculty"),
    closeAttendanceSession
);

// ==========================================
// Student marks attendance
// POST /api/attendance-sessions/:id/mark
// ==========================================
router.post(
    "/:id/mark",
    authMiddleware,
    roleMiddleware("student"),
    markAttendance
);

module.exports = router;