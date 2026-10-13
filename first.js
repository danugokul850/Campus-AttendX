require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// ==========================================
// DATABASE AND REDIS CONNECTIONS
// ==========================================

const mongoDB = require("./src/db/database");
const redisClient = require("./src/config/redis");

// ==========================================
// AUTHENTICATION AND RECOVERY ROUTES
// ==========================================

const recoveryRouter = require("./src/routes/recoveryRoutes");
const authRouter = require("./src/routes/auth.routes");

// ==========================================
// FACULTY ROUTES
// ==========================================

const subjectRouter = require("./src/routes/faculty/subject.routes");

const attendanceSessionRouter = require(
    "./src/routes/faculty/attendanceSession.routes"
);

const facultySettingsRouter = require(
    "./src/routes/faculty/facultySettings.routes"
);

// ==========================================
// GOOGLE DRIVE ROUTES
// ==========================================

const googleRouter = require("./src/routes/google.routes");

// ==========================================
// ADMIN ROUTES
// ==========================================

const adminSubjectRouter = require(
    "./src/routes/admin/adminSubject.routes"
);

const adminAttendanceRouter = require(
    "./src/routes/admin/adminAttendance.routes"
);

const adminUserRouter = require(
    "./src/routes/admin/adminUser.routes"
);

const adminDashboardRouter = require(
    "./src/routes/admin/adminDashboard.routes"
);

const adminReportRouter = require(
    "./src/routes/admin/adminReport.routes"
);

const adminNotificationRouter = require(
    "./src/routes/admin/adminNotification.routes"
);

const adminProfileRouter = require(
    "./src/routes/admin/adminProfile.routes"
);

// ==========================================
// STUDENT ROUTES
// ==========================================

const studentDashboardRouter = require(
    "./src/routes/student/studentDashboard.routes"
);

const studentAttendanceRouter = require(
    "./src/routes/student/studentAttendance.routes"
);

const studentSubjectsRouter = require(
    "./src/routes/student/studentSubjects.routes"
);

const studentNotificationRouter = require(
    "./src/routes/student/studentNotification.routes"
);

const studentSettingsRouter = require(
    "./src/routes/student/studentSettings.routes"
);

const studentScanAttendanceRouter = require(
    "./src/routes/student/studentScanAttendance.routes"
);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cookieParser());
app.use(express.json());

// ==========================================
// AUTHENTICATION AND RECOVERY
// ==========================================

app.use("/api/recovery", recoveryRouter);
app.use("/api", authRouter);

// ==========================================
// FACULTY ROUTES
// ==========================================

app.use("/api/subjects", subjectRouter);

app.use("/api/attendance-sessions", attendanceSessionRouter);

app.use("/api/faculty/settings", facultySettingsRouter);

// ==========================================
// GOOGLE DRIVE ROUTES
// ==========================================

app.use("/api/google", googleRouter);

// ==========================================
// ADMIN ROUTES
// ==========================================

app.use("/api/admin/subjects", adminSubjectRouter);

app.use("/api/admin/attendance", adminAttendanceRouter);

app.use("/api/admin/users", adminUserRouter);

app.use("/api/admin/dashboard", adminDashboardRouter);

app.use("/api/admin/reports", adminReportRouter);

app.use(
    "/api/admin/dashboard/notifications",
    adminNotificationRouter
);

app.use("/api/admin/profile", adminProfileRouter);

// ==========================================
// STUDENT ROUTES
// ==========================================

app.use("/api/student/dashboard", studentDashboardRouter);

app.use("/api/student/attendance", studentAttendanceRouter);

app.use("/api/student/subjects", studentSubjectsRouter);

app.use("/api/student/notifications", studentNotificationRouter);

app.use("/api/student/settings", studentSettingsRouter);

app.use("/api/student/scan-attendance", studentScanAttendanceRouter);

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

async function Initialization() {
    try {
        await Promise.all([
            mongoDB(),
            redisClient.connect()
        ]);

        console.log("MongoDB and Redis connected successfully");

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