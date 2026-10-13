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
    markAttendance,
    getAttendanceSummary,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendanceReport
} = require("../../controllers/faculty/attendanceSession.controller");


// ==========================================
// Faculty creates attendance session
// ==========================================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("faculty"),
    createAttendanceSession
);


// ==========================================
// Faculty gets own sessions
// ==========================================

router.get(
    "/my-sessions",
    authMiddleware,
    roleMiddleware("faculty"),
    getMySessions
);


// ==========================================
// Faculty gets attendance summary
// ==========================================

router.get(
    "/:id/summary",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSummary
);


// ==========================================
// Faculty gets one session
// ==========================================

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("faculty"),
    getAttendanceSessionById
);


// ==========================================
// Faculty manually closes session
// ==========================================

router.patch(
    "/:id/close",
    authMiddleware,
    roleMiddleware("faculty"),
    closeAttendanceSession
);


// ==========================================
// Student marks attendance
// ==========================================

router.post(
    "/:id/mark",
    authMiddleware,
    roleMiddleware("student"),
    markAttendance
);

// =====================================================
// MONTHLY REPORT
// IMPORTANT: keep before /:id
// =====================================================

router.get(
    "/reports/monthly",
    authMiddleware,
    roleMiddleware("faculty"),
    getMonthlyAttendanceReport
);

// =====================================================
// DOWNLOAD MONTHLY REPORT
// =====================================================

router.get(
    "/reports/monthly/download",
    authMiddleware,
    roleMiddleware("faculty"),
    downloadMonthlyAttendanceReport
);



module.exports = router;