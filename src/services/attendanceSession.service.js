const crypto = require("crypto");

const AttendanceSession =
    require("../models/AttendanceSession");

const Subject =
    require("../models/Subject");

const Attendance =
    require("../models/Attendance");


const SESSION_DURATION = 24 * 1000;

const QR_DURATION = 12 * 1000;


/*
    Faculty creates attendance session
*/
const createAttendanceSession = async ({
    facultyId,
    subjectId
}) => {

    const subject =
        await Subject.findOne({
            _id: subjectId,
            submittedBy: facultyId,
            status: "approved",
            isActive: true
        });

    if (!subject) {
        throw new Error(
            "Approved subject not found or you are not authorized"
        );
    }

    /*
        Prevent multiple active sessions
        for the same subject/faculty.
    */

const oneHourAgo = new Date(
    Date.now() - 60 * 60 * 1000
);

const recentSession =
await AttendanceSession.findOne({
    subject: subjectId,
    faculty: facultyId,
    createdAt: {
        $gte: oneHourAgo
    }
});

if (recentSession) {
    throw new Error(
        "Attendance for this subject was already conducted within the last hour"
    );
}

    const startedAt = new Date();

    const expiresAt =
        new Date(
            startedAt.getTime() +
            SESSION_DURATION
        );

    const sessionCode =
        crypto.randomBytes(32).toString("hex");

    const session =
        await AttendanceSession.create({

            subject: subject._id,

            faculty: facultyId,

            sessionCode,

            startedAt,

            expiresAt,

            status: "active"
        });

    return {
        session,
        qr: {
            expiresAt: new Date(
                startedAt.getTime() +
                QR_DURATION
            )
        }
    };
};


/*
    Faculty gets own sessions
*/
const getMySessions = async (facultyId) => {

    return await AttendanceSession
        .find({
            faculty: facultyId
        })
        .populate(
            "subject",
            "subjectName subjectCode course branch semester"
        )
        .sort({
            createdAt: -1
        });
};


/*
    Get one session
*/
const getAttendanceSessionById = async ({
    sessionId,
    facultyId
}) => {

    const session =
        await AttendanceSession
            .findOne({
                _id: sessionId,
                faculty: facultyId
            })
            .populate(
                "subject",
                "subjectName subjectCode course branch semester"
            );

    if (!session) {
        throw new Error(
            "Attendance session not found"
        );
    }

    return session;
};


/*
    Faculty manually closes session
*/
const closeAttendanceSession = async ({
    sessionId,
    facultyId
}) => {

    const session =
        await AttendanceSession.findOne({
            _id: sessionId,
            faculty: facultyId
        });

    if (!session) {
        throw new Error(
            "Attendance session not found"
        );
    }

    if (session.status !== "active") {
        throw new Error(
            "Attendance session is not active"
        );
    }

    session.status = "closed";

    session.closedAt = new Date();

    await session.save();

    return session;
};


/*
    Student marks attendance
*/
const markAttendance = async ({
    sessionId,
    studentId
}) => {

    const session =
        await AttendanceSession.findById(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Attendance session not found"
        );
    }


    const now = new Date();


    /*
        Check whether session has expired
    */
    if (
        session.status !== "active" ||
        now > session.expiresAt
    ) {

        if (session.status === "active") {
            session.status = "expired";
            await session.save();
        }

        throw new Error(
            "Attendance session has expired"
        );
    }


    /*
        Check whether student already marked
    */
    const existingAttendance =
        await Attendance.findOne({
            session: sessionId,
            student: studentId
        });

    if (existingAttendance) {
        throw new Error(
            "Attendance already marked"
        );
    }


    /*
        Create attendance
    */
    const attendance =
        await Attendance.create({

            session: sessionId,

            student: studentId,

            markedAt: now,

            status: "present"
        });


    return attendance;
};


module.exports = {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    closeAttendanceSession,
    markAttendance
};