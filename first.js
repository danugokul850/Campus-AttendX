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



app.use(cookieParser());
app.use(express.json());


app.use('/api/recovery',router);
app.use('/api',authRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/admin/subjects", adminSubjectRouter);
app.use("/api/google", googleRouter);
app.use( "/api/attendance-sessions",attendanceSessionRouter);



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


