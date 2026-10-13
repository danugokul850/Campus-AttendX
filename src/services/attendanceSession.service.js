const crypto = require("crypto");

const AttendanceSession = require("../models/AttendanceSession");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

// ==========================================
// SESSION CONFIGURATION
// ==========================================

// A session lasts five minutes.
// The QR expiry timestamp is initially set to 12 seconds.
const SESSION_DURATION = 5 * 60 * 1000;
const QR_DURATION = 12 * 1000;

// ==========================================
// CREATE ATTENDANCE SESSION
// ==========================================

const createAttendanceSession = async ({ facultyId, subjectId }) => {
    if (!subjectId || !/^[a-f\d]{24}$/i.test(String(subjectId))) {
        throw new Error("A valid subjectId is required");
    }

    // Verify subject ownership, approval, and active status.
    const subject = await Subject.findOne({
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

    // Prevent the same faculty from creating another session
    // for this subject within one hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentSession = await AttendanceSession.findOne({
        subject: subjectId,
        faculty: facultyId,
        createdAt: { $gte: oneHourAgo }
    });

    if (recentSession) {
        throw new Error(
            "You already conducted attendance for this subject within the last hour"
        );
    }

    const startedAt = new Date();

    const expiresAt = new Date(
        startedAt.getTime() + SESSION_DURATION
    );

    // Generate a cryptographically random session code.
    const sessionCode = crypto.randomBytes(32).toString("hex");

    const session = await AttendanceSession.create({
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
                startedAt.getTime() + QR_DURATION
            )
        }
    };
};

// ==========================================
// FACULTY GETS OWN SESSIONS
// ==========================================

const getMySessions = async (facultyId) => {
    return AttendanceSession.find({
        faculty: facultyId
    })
        .populate(
            "subject",
            "subjectName subjectCode course branch semester"
        )
        .sort({ createdAt: -1 });
};

// ==========================================
// FACULTY GETS ONE SESSION
// ==========================================

const getAttendanceSessionById = async ({ sessionId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    }).populate(
        "subject",
        "subjectName subjectCode course branch semester"
    );

    if (!session) {
        throw new Error("Attendance session not found");
    }

    return session;
};

// ==========================================
// FACULTY CLOSES SESSION
// ==========================================

const closeAttendanceSession = async ({ sessionId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    });

    if (!session) {
        throw new Error("Attendance session not found");
    }

    if (session.status !== "active") {
        throw new Error("Attendance session is not active");
    }

    session.status = "closed";
    session.closedAt = new Date();

    await session.save();

    return session;
};

// ==========================================
// STUDENT MARKS ATTENDANCE
// ==========================================

const markAttendance = async ({ sessionId, studentId }) => {
    if (!/^[a-f\d]{24}$/i.test(String(sessionId))) {
        throw new Error("A valid attendance session ID is required");
    }

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
        throw new Error("Attendance session not found");
    }

    const now = new Date();

    // Check whether the session is active and unexpired.
    if (
        session.status !== "active" ||
        now >= session.expiresAt
    ) {
        if (
            session.status === "active" &&
            now >= session.expiresAt
        ) {
            session.status = "expired";
            await session.save();
        }

        throw new Error("Attendance session has expired");
    }

    // Verify the associated subject.
    const subject = await Subject.findById(session.subject);

    if (
        !subject ||
        !subject.isActive ||
        subject.status !== "approved"
    ) {
        throw new Error(
            "The subject associated with this session is unavailable"
        );
    }

    // Verify that the student exists and is active.
    const student = await User.findOne({
        _id: studentId,
        role: "student",
        isActive: true
    });

    if (!student) {
        throw new Error("Active student not found");
    }

    // Verify course, branch, and semester eligibility.
    if (
        student.course !== subject.course ||
        student.branch !== subject.branch ||
        student.semester !== subject.semester
    ) {
        throw new Error("You are not eligible for this subject");
    }

    // Prevent duplicate attendance for the same session.
    const existingAttendance = await Attendance.findOne({
        session: sessionId,
        student: studentId
    });

    if (existingAttendance) {
        throw new Error("Attendance already marked");
    }

    return Attendance.create({
        session: sessionId,
        student: studentId,
        markedAt: now,
        status: "present"
    });
};

// ==========================================
// FACULTY GETS ATTENDANCE SUMMARY
// ==========================================

const getAttendanceSummary = async ({ sessionId, facultyId }) => {
    const session = await AttendanceSession.findOne({
        _id: sessionId,
        faculty: facultyId
    }).populate(
        "subject",
        "subjectName subjectCode course branch semester"
    );

    if (!session) {
        throw new Error("Attendance session not found");
    }

    const subject = session.subject;

    if (!subject) {
        throw new Error(
            "Subject associated with this session was not found"
        );
    }

    // Find all active students eligible for this subject.
    const students = await User.find({
        role: "student",
        course: subject.course,
        branch: subject.branch,
        semester: subject.semester,
        isActive: true
    })
        .select("firstName lastName registrationNumber")
        .sort({ registrationNumber: 1 });

    // Find students who marked attendance.
    const attendanceRecords = await Attendance.find({
        session: sessionId,
        status: "present"
    }).populate(
        "student",
        "firstName lastName registrationNumber"
    );

    const presentStudentIds = new Set(
        attendanceRecords
            .filter(record => record.student)
            .map(record => record.student._id.toString())
    );

    const presentStudents = [];
    const absentStudents = [];

    for (const student of students) {
        const studentData = {
            studentId: student._id,
            registrationNumber: student.registrationNumber,
            name: `${student.firstName} ${student.lastName}`
        };

        if (presentStudentIds.has(student._id.toString())) {
            presentStudents.push(studentData);
        } else {
            absentStudents.push(studentData);
        }
    }

    const totalStudents = students.length;
    const present = presentStudents.length;
    const absent = absentStudents.length;

    const attendancePercentage = totalStudents > 0
        ? Number(((present / totalStudents) * 100).toFixed(2))
        : 0;

    return {
        session: {
            id: session._id,
            subject: {
                id: subject._id,
                name: subject.subjectName,
                code: subject.subjectCode,
                course: subject.course,
                branch: subject.branch,
                semester: subject.semester
            },
            startedAt: session.startedAt,
            expiresAt: session.expiresAt,
            status: session.status
        },
        summary: {
            totalStudents,
            present,
            absent,
            attendancePercentage
        },
        presentStudents,
        absentStudents
    };
};

// ==========================================
// FACULTY GETS MONTHLY ATTENDANCE REPORT
// ==========================================

const getMonthlyAttendanceReport = async ({
    subjectId,
    facultyId,
    month,
    year
}) => {
    const selectedMonth = Number(month);
    const selectedYear = Number(year);
    const currentYear = new Date().getFullYear();

    // Validate month.
    if (
        !Number.isInteger(selectedMonth) ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {
        throw new Error("Invalid month");
    }

    // Validate year.
    if (
        !Number.isInteger(selectedYear) ||
        selectedYear < 2000 ||
        selectedYear > currentYear
    ) {
        throw new Error("Invalid year");
    }

    if (!subjectId || !/^[a-f\d]{24}$/i.test(String(subjectId))) {
        throw new Error("A valid subjectId is required");
    }

    // Only allow the faculty member to report on their own
    // approved and active subject.
    const subject = await Subject.findOne({
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

    const startDate = new Date(
        selectedYear,
        selectedMonth - 1,
        1
    );

    const endDate = new Date(
        selectedYear,
        selectedMonth,
        1
    );

    const now = new Date();

    if (startDate > now) {
        throw new Error(
            "Future month attendance report is not available"
        );
    }

    if (now < endDate) {
        throw new Error(
            "Monthly attendance report is available only after the selected month has been completed"
        );
    }

    // Find all sessions for this subject during the selected month.
    const sessions = await AttendanceSession.find({
        subject: subject._id,
        faculty: facultyId,
        startedAt: {
            $gte: startDate,
            $lt: endDate
        }
    }).sort({ startedAt: 1 });

    const totalClassesConducted = sessions.length;

    // Find eligible active students.
    const students = await User.find({
        role: "student",
        course: subject.course,
        branch: subject.branch,
        semester: subject.semester,
        isActive: true
    })
        .select("firstName lastName registrationNumber")
        .sort({ registrationNumber: 1 });

    const subjectInfo = {
        id: subject._id,
        name: subject.subjectName,
        code: subject.subjectCode,
        course: subject.course,
        branch: subject.branch,
        semester: subject.semester
    };

    // Return a report even when no classes were conducted.
    if (totalClassesConducted === 0) {
        return {
            month: selectedMonth,
            year: selectedYear,
            subject: subjectInfo,
            totalClassesConducted: 0,
            totalStudents: students.length,
            studentsBelow75: 0,
            students: students.map(student => ({
                studentId: student._id,
                name: `${student.firstName} ${student.lastName}`,
                registrationNumber: student.registrationNumber,
                classesConducted: 0,
                present: 0,
                absent: 0,
                attendancePercentage: null,
                below75: false
            }))
        };
    }

    const sessionIds = sessions.map(session => session._id);

    const attendanceRecords = await Attendance.find({
        session: { $in: sessionIds },
        status: "present"
    });

    // Count attended classes for each student.
    const attendanceCount = new Map();

    for (const record of attendanceRecords) {
        const studentId = record.student.toString();

        attendanceCount.set(
            studentId,
            (attendanceCount.get(studentId) || 0) + 1
        );
    }

    const studentReports = students.map(student => {
        const studentId = student._id.toString();
        const present = attendanceCount.get(studentId) || 0;
        const absent = totalClassesConducted - present;

        const attendancePercentage = Number(
            ((present / totalClassesConducted) * 100).toFixed(2)
        );

        return {
            studentId: student._id,
            name: `${student.firstName} ${student.lastName}`,
            registrationNumber: student.registrationNumber,
            classesConducted: totalClassesConducted,
            present,
            absent,
            attendancePercentage,
            below75: attendancePercentage < 75
        };
    });

    const studentsBelow75 = studentReports.filter(
        student => student.attendancePercentage < 75
    ).length;

    return {
        month: selectedMonth,
        year: selectedYear,
        subject: subjectInfo,
        totalClassesConducted,
        totalStudents: students.length,
        studentsBelow75,
        students: studentReports
    };
};

// ==========================================
// DOWNLOAD MONTHLY ATTENDANCE REPORT (CSV)
// ==========================================

const downloadMonthlyAttendanceReport = async ({
    subjectId,
    facultyId,
    month,
    year
}) => {
    const report = await getMonthlyAttendanceReport({
        subjectId,
        facultyId,
        month,
        year
    });

    const rows = [
        [
            "Registration Number",
            "Student Name",
            "Total Classes",
            "Present",
            "Absent",
            "Attendance Percentage",
            "Below 75%"
        ]
    ];

    for (const student of report.students) {
        rows.push([
            student.registrationNumber,
            student.name,
            student.classesConducted,
            student.present,
            student.absent,
            student.attendancePercentage === null
                ? "N/A"
                : `${student.attendancePercentage}%`,
            student.below75 ? "YES" : "NO"
        ]);
    }

    // Escape quotes, commas, and newlines for valid CSV.
    const csv = rows
        .map(row =>
            row
                .map(value => {
                    const stringValue = String(value ?? "");
                    return `"${stringValue.replace(/"/g, '""')}"`;
                })
                .join(",")
        )
        .join("\n");

    const fileName =
        `${report.subject.code}_${report.month}_${report.year}_attendance.csv`;

    return {
        buffer: Buffer.from(csv, "utf-8"),
        fileName,
        contentType: "text/csv; charset=utf-8"
    };
};

// ==========================================
// EXPORT SERVICE FUNCTIONS
// ==========================================

module.exports = {
    createAttendanceSession,
    getMySessions,
    getAttendanceSessionById,
    closeAttendanceSession,
    markAttendance,
    getAttendanceSummary,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendanceReport
};