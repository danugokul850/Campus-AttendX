require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// Database and Redis connections
const mongoDB = require("./src/db/database");
const redisClient = require("./src/config/redis");

// Authentication and recovery routes
const router = require("./src/routes/recoveryRoutes");
const authRouter = require("./src/routes/auth.routes");

// Faculty routes
const subjectRouter = require("./src/routes/faculty/subject.routes");
const attendanceSessionRouter = require("./src/routes/faculty/attendanceSession.routes");
const facultySettingsRouter = require("./src/routes/faculty/facultySettings.routes");

// Google Drive routes
const googleRouter = require("./src/routes/google.routes");

// Admin routes
const adminSubjectRouter = require("./src/routes/admin/adminSubject.routes");
const adminAttendanceRouter = require("./src/routes/admin/adminAttendance.routes");
const adminUserRouter = require("./src/routes/admin/adminUser.routes");
const adminDashboardRouter = require("./src/routes/admin/adminDashboard.routes");
const adminReportRouter = require("./src/routes/admin/adminReport.routes");
const adminNotificationRouter = require("./src/routes/admin/adminNotification.routes");
const adminProfileRouter = require("./src/routes/admin/adminProfile.routes");

// Student routes
const studentDashboardRouter = require("./src/routes/student/studentDashboard.routes");
const studentAttendanceRouter = require("./src/routes/student/studentAttendance.routes");
const studentSubjectsRouter = require("./src/routes/student/studentSubjects.routes");
const studentNotificationRouter = require("./src/routes/student/studentNotification.routes");
const studentSettingsRouter = require("./src/routes/student/studentSettings.routes");
const studentScanAttendanceRouter = require("./src/routes/student/studentScanAttendance.routes");

// Middleware
app.use(cookieParser());
app.use(express.json());

// Authentication and recovery
app.use("/api/recovery", router);
app.use("/api", authRouter);

// Faculty routes
app.use("/api/subjects", subjectRouter);
app.use("/api/attendance-sessions", attendanceSessionRouter);
app.use("/api/faculty/settings", facultySettingsRouter);

// Google Drive routes
app.use("/api/google", googleRouter);

// Admin routes
app.use("/api/admin/subjects", adminSubjectRouter);
app.use("/api/admin/attendance", adminAttendanceRouter);
app.use("/api/admin/users", adminUserRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/reports", adminReportRouter);
app.use("/api/admin/dashboard/notifications", adminNotificationRouter);
app.use("/api/admin/profile", adminProfileRouter);

// Student routes
app.use("/api/student/dashboard", studentDashboardRouter);
app.use("/api/student/attendance", studentAttendanceRouter);
app.use("/api/student/subjects", studentSubjectsRouter);
app.use("/api/student/notifications", studentNotificationRouter);
app.use("/api/student/settings", studentSettingsRouter);
app.use("/api/student/scan-attendance", studentScanAttendanceRouter);

// Initialize application
async function Initialization() {
    try {
        await Promise.all([
            mongoDB(),
            redisClient.connect()
        ]);

        console.log("Mongo & Redis connected successfully");

        const PORT = process.env.PORT || 4000;

        app.listen(PORT, () => {
            console.log(`Server listening at port ${PORT}`);
        });
    } catch (err) {
        console.error("Initialization failed:", err.message);
        process.exit(1);
    }
}

Initialization();