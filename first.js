require('dotenv').config();
const express = require('express');
const app = express();

const cookieParser = require("cookie-parser");

// Connection strigs...
const mongoDB = require("./src/db/database");
const redisClient = require("./src/config/redis");

const router = require("./src/routes/recoveryRoutes");
const authRouter = require("./src/routes/auth.routes");
const subjectRouter = require("./src/routes/faculty/subject.routes");
const adminSubjectRouter = require("./src/routes/admin/adminSubject.routes");
const googleRouter = require("./src/routes/google.routes");
const attendanceSessionRouter = require("./src/routes/faculty/attendanceSession.routes");
const facultySettingsRouter = require("./src/routes/faculty/facultySettings.routes");

// Admin...
const adminAttendanceRouter = require("./src/routes/admin/adminAttendance.routes");
const adminUserRouter = require("./src/routes/admin/adminUser.routes");
const adminDashboardRouter = require("./src/routes/admin/adminDashboard.routes");
const adminReportRouter = require("./src/routes/admin/adminReport.routes");
const adminNotificationRouter = require("./src/routes/admin/adminNotification.routes");
const adminProfileRouter = require("./src/routes/admin/adminProfile.routes");

// Student..
const studentDashboardRouter = require("./src/routes/student/studentDashboard.routes");
const studentAttendanceRouter = require("./src/routes/student/studentAttendance.routes");
const studentSubjectsRouter = require("./src/routes/student/studentSubjects.routes");
const studentNotificationRouter = require("./src/routes/student/studentNotification.routes");
const studentSettingsRouter = require("./src/routes/student/studentSettings.routes");








app.use(cookieParser());
app.use(express.json());


app.use('/api/recovery',router);
app.use('/api',authRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/admin/subjects", adminSubjectRouter);
app.use("/api/google", googleRouter);
app.use("/api/attendance-sessions",attendanceSessionRouter);
app.use("/api/faculty/settings",facultySettingsRouter);

// Admin Dashboard Routes
app.use("/api/admin/attendance",adminAttendanceRouter);
app.use("/api/admin/users",adminUserRouter);
app.use("/api/admin/dashboard",adminDashboardRouter);
app.use("/api/admin/reports",adminReportRouter);
app.use("/api/admin/dashboard/notifications",adminNotificationRouter);
app.use("/api/admin/profile", adminProfileRouter);

// Student Dashboard Routes
app.use("/api/student/dashboard",studentDashboardRouter);
app.use("/api/student/attendance",studentAttendanceRouter);
app.use("/api/student/subjects",studentSubjectsRouter);
app.use("/api/student/notifications",studentNotificationRouter);
app.use("/api/student/settings",studentSettingsRouter);



async function Initialization() {
    try {
        await Promise.all([mongoDB(), redisClient.connect()]);
        console.log('Mongo & Redis connected successfully');

        app.listen(process.env.PORT, () => {
            console.log(`Server listening at the port number ${process.env.PORT} `);
        });
    } catch (err) {
        console.log("Initialization failed:", err.message);
        process.exit(1);
    }
}
Initialization();


