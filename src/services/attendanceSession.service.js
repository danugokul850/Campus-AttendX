const crypto = require("crypto");

const AttendanceSession =
    require("../models/AttendanceSession");

const Subject =
    require("../models/Subject");

const Attendance =
    require("../models/Attendance");

const User =
    require("../models/User");


// ==========================================
// Attendance session duration
// ==========================================

const SESSION_DURATION = 5 * 60 * 1000;
// 5 minutes


// ==========================================
// Faculty creates attendance session
// ==========================================

const createAttendanceSession = async ({
    facultyId,
    subjectId
}) => {

    /*
        Check that:

        1. Subject exists
        2. Subject belongs to this faculty
        3. Subject is approved
        4. Subject is active
    */

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


    // ==========================================
    // Prevent same faculty from conducting
    // same subject again within one hour
    // ==========================================

    const oneHourAgo =
        new Date(
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
            "You already conducted attendance for this subject within the last hour"
        );

    }


    // ==========================================
    // Create 5-minute session
    // ==========================================

    const startedAt =
        new Date();


    const expiresAt =
        new Date(
            startedAt.getTime() +
            SESSION_DURATION
        );


    // ==========================================
    // Generate unique session code
    // ==========================================

    const sessionCode =
        crypto
            .randomBytes(32)
            .toString("hex");


    // ==========================================
    // Save session
    // ==========================================

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

        session

    };
};


// ==========================================
// Faculty gets all own sessions
// ==========================================

const getMySessions = async (
    facultyId
) => {

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


// ==========================================
// Faculty gets one own session
// ==========================================

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


// ==========================================
// Faculty manually closes session
// ==========================================

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


// ==========================================
// Student marks attendance
// ==========================================

const markAttendance = async ({
    sessionId,
    studentId
}) => {

    // ==========================================
    // Find attendance session
    // ==========================================

    const session =
        await AttendanceSession.findById(
            sessionId
        );


    if (!session) {

        throw new Error(
            "Attendance session not found"
        );

    }


    const now =
        new Date();


    // ==========================================
    // Check session expiration
    // ==========================================

    if (
        session.status !== "active" ||
        now > session.expiresAt
    ) {

        /*
            If the session was still marked
            active in MongoDB but its time
            has passed, mark it expired.
        */

        if (
            session.status === "active"
        ) {

            session.status = "expired";

            await session.save();

        }


        throw new Error(
            "Attendance session has expired"
        );

    }


    // ==========================================
    // Get subject
    // ==========================================

    const subject =
        await Subject.findById(
            session.subject
        );


    if (!subject) {

        throw new Error(
            "Subject associated with this session was not found"
        );

    }


    // ==========================================
    // Get student
    // ==========================================

    const student =
        await User.findOne({

            _id: studentId,

            role: "student",

            isActive: true

        });


    if (!student) {

        throw new Error(
            "Active student not found"
        );

    }


    // ==========================================
    // Verify that student belongs to the
    // subject's course, branch and semester
    // ==========================================

    if (

        student.course !== subject.course ||

        student.branch !== subject.branch ||

        student.semester !== subject.semester

    ) {

        throw new Error(
            "You are not eligible for this subject"
        );

    }


    // ==========================================
    // Check duplicate attendance
    // ==========================================

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


    // ==========================================
    // Create attendance record
    // ==========================================

    const attendance =
        await Attendance.create({

            session: sessionId,

            student: studentId,

            markedAt: now,

            status: "present"

        });


    return attendance;
};


// ==========================================
// Faculty gets attendance summary
// ==========================================

const getAttendanceSummary = async ({
    sessionId,
    facultyId
}) => {

    // ==========================================
    // Get session
    // ==========================================

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


    const subject =
        session.subject;


    // ==========================================
    // Find all registered active students
    // according to:
    //
    // course
    // branch
    // semester
    // ==========================================

    const students =
        await User.find({

            role: "student",

            course: subject.course,

            branch: subject.branch,

            semester: subject.semester,

            isActive: true

        })

        .select(
            "firstName lastName registrationNumber"
        )

        .sort({

            registrationNumber: 1

        });


    // ==========================================
    // Find students who marked attendance
    // ==========================================

    const attendanceRecords =
        await Attendance.find({

            session: sessionId

        })

        .populate(

            "student",

            "firstName lastName registrationNumber"

        );


    // ==========================================
    // Create Set of present student IDs
    // ==========================================

    const presentStudentIds =
        new Set(

            attendanceRecords.map(

                attendance =>
                    attendance.student._id.toString()

            )

        );


    // ==========================================
    // Separate present and absent students
    // ==========================================

    const presentStudents = [];

    const absentStudents = [];


    for (
        const student
        of students
    ) {

        const studentData = {

            studentId:
                student._id,

            registrationNumber:
                student.registrationNumber,

            name:
                `${student.firstName} ${student.lastName}`

        };


        if (

            presentStudentIds.has(

                student._id.toString()

            )

        ) {

            presentStudents.push(
                studentData
            );

        } else {

            absentStudents.push(
                studentData
            );

        }

    }


    // ==========================================
    // Calculate summary
    // ==========================================

    const totalStudents =
        students.length;


    const present =
        presentStudents.length;


    const absent =
        absentStudents.length;


    const attendancePercentage =

        totalStudents > 0

            ? Number(

                (

                    (present / totalStudents) *
                    100

                ).toFixed(2)

            )

            : 0;


    // ==========================================
    // Return complete summary
    // ==========================================

    return {

        session: {

            id:
                session._id,

            subject: {

                id:
                    subject._id,

                name:
                    subject.subjectName,

                code:
                    subject.subjectCode,

                course:
                    subject.course,

                branch:
                    subject.branch,

                semester:
                    subject.semester

            },

            startedAt:
                session.startedAt,

            expiresAt:
                session.expiresAt,

            status:
                session.status

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


// =====================================================
// FACULTY GET MONTHLY ATTENDANCE REPORT
// =====================================================

const getMonthlyAttendanceReport = async ({
    subjectId,
    facultyId,
    month,
    year
}) => {

    // ---------------------------------------------
    // Validate month and year
    // ---------------------------------------------

    const selectedMonth = Number(month);
    const selectedYear = Number(year);


    if (
        !selectedMonth ||
        selectedMonth < 1 ||
        selectedMonth > 12
    ) {

        throw new Error("Invalid month");

    }


    if (
        !selectedYear ||
        selectedYear < 2000
    ) {

        throw new Error("Invalid year");

    }


    // ---------------------------------------------
    // Find subject
    // ---------------------------------------------

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


    // ---------------------------------------------
    // Start and end of selected month
    // ---------------------------------------------

    const startDate =
        new Date(
            selectedYear,
            selectedMonth - 1,
            1
        );


    const endDate =
        new Date(
            selectedYear,
            selectedMonth,
            1
        );


    // ---------------------------------------------
    // Monthly report is available only after
    // the selected month has been completed
    // ---------------------------------------------

    const now = new Date();


    // Future month
    if (startDate > now) {

        throw new Error(
            "Future month attendance report is not available"
        );

    }


    // Current month is still incomplete
    if (now < endDate) {

        throw new Error(
            "Monthly attendance report is available only after the selected month has been completed"
        );

    }


    // ---------------------------------------------
    // Find all classes conducted this month
    // ---------------------------------------------

    const sessions =
        await AttendanceSession.find({

            subject: subject._id,

            faculty: facultyId,

            startedAt: {

                $gte: startDate,

                $lt: endDate

            }

        }).sort({

            startedAt: 1

        });


    // ---------------------------------------------
    // Total classes conducted
    // ---------------------------------------------

    const totalClassesConducted =
        sessions.length;


    // ---------------------------------------------
    // Find all eligible students
    // ---------------------------------------------

    const students =
        await User.find({

            role: "student",

            course: subject.course,

            branch: subject.branch,

            semester: subject.semester,

            isActive: true

        })

        .select(
            "firstName lastName registrationNumber"
        )

        .sort({

            registrationNumber: 1

        });


    // ---------------------------------------------
    // If there are no classes
    // ---------------------------------------------

    if (totalClassesConducted === 0) {

        return {

            month: selectedMonth,

            year: selectedYear,


            subject: {

                id: subject._id,

                name: subject.subjectName,

                code: subject.subjectCode,

                course: subject.course,

                branch: subject.branch,

                semester: subject.semester

            },


            totalClassesConducted: 0,

            totalStudents: students.length,

            studentsBelow75: 0,


            students: students.map(student => ({

                studentId:
                    student._id,

                name:
                    `${student.firstName} ${student.lastName}`,

                registrationNumber:
                    student.registrationNumber,

                classesConducted: 0,

                present: 0,

                absent: 0,

                attendancePercentage: null,

                below75: false

            }))

        };

    }


    // ---------------------------------------------
    // Get all attendance records
    // for this month's sessions
    // ---------------------------------------------

    const sessionIds =
        sessions.map(
            session => session._id
        );


    const attendanceRecords =
        await Attendance.find({

            session: {

                $in: sessionIds

            },

            status: "present"

        });


    // ---------------------------------------------
    // Count attendance for each student
    // ---------------------------------------------

    const attendanceCount =
        new Map();


    for (
        const record
        of attendanceRecords
    ) {

        const studentId =
            record.student.toString();


        const currentCount =
            attendanceCount.get(studentId) || 0;


        attendanceCount.set(

            studentId,

            currentCount + 1

        );

    }


    // ---------------------------------------------
    // Create student report
    // ---------------------------------------------

    const studentReports =
        students.map(student => {

            const studentId =
                student._id.toString();


            const present =
                attendanceCount.get(studentId) || 0;


            const absent =
                totalClassesConducted - present;


            const attendancePercentage =
                Number(

                    (

                        (present /
                            totalClassesConducted) *

                        100

                    ).toFixed(2)

                );


            return {

                studentId:
                    student._id,

                name:
                    `${student.firstName} ${student.lastName}`,

                registrationNumber:
                    student.registrationNumber,

                classesConducted:
                    totalClassesConducted,

                present,

                absent,

                attendancePercentage,

                below75:
                    attendancePercentage < 75

            };

        });


    // ---------------------------------------------
    // Count students below 75%
// ---------------------------------------------

    const studentsBelow75 =
        studentReports.filter(

            student =>
                student.attendancePercentage < 75

        ).length;


    // ---------------------------------------------
    // Return complete report
    // ---------------------------------------------

    return {

        month: selectedMonth,

        year: selectedYear,


        subject: {

            id: subject._id,

            name: subject.subjectName,

            code: subject.subjectCode,

            course: subject.course,

            branch: subject.branch,

            semester: subject.semester

        },


        totalClassesConducted,

        totalStudents:
            students.length,

        studentsBelow75,

        students:
            studentReports

    };

};


// =====================================================
// DOWNLOAD MONTHLY ATTENDANCE REPORT
// =====================================================

const downloadMonthlyAttendanceReport = async ({
    subjectId,
    facultyId,
    month,
    year
}) => {

    // ---------------------------------------------
    // Get monthly report
    //
    // This automatically checks whether the
    // selected month has been completed.
    // ---------------------------------------------

    const report =
        await getMonthlyAttendanceReport({

            subjectId,

            facultyId,

            month,

            year

        });


    // ---------------------------------------------
    // CSV HEADER
    // ---------------------------------------------

    const rows = [];


    rows.push([

        "Registration Number",

        "Student Name",

        "Total Classes",

        "Present",

        "Absent",

        "Attendance Percentage",

        "Below 75%"

    ]);


    // ---------------------------------------------
    // CSV DATA
    // ---------------------------------------------

    for (
        const student
        of report.students
    ) {

        rows.push([

            student.registrationNumber,

            student.name,

            student.classesConducted,

            student.present,

            student.absent,

            student.attendancePercentage === null

                ? "N/A"

                : `${student.attendancePercentage}%`,

            student.below75

                ? "YES"

                : "NO"

        ]);

    }


    // ---------------------------------------------
    // Convert rows into CSV
    // ---------------------------------------------

    const csv =
        rows

            .map(row =>

                row

                    .map(value => {

                        const stringValue =
                            String(value ?? "");


                        return `"${stringValue.replace(
                            /"/g,
                            '""'
                        )}"`;

                    })

                    .join(",")

            )

            .join("\n");


    // ---------------------------------------------
    // Generate file name
    // ---------------------------------------------

    const fileName =
        `${report.subject.code}_${report.month}_${report.year}_attendance.csv`;


    // ---------------------------------------------
    // Return downloadable file
    // ---------------------------------------------

    return {

        buffer:
            Buffer.from(
                csv,
                "utf-8"
            ),

        fileName,

        contentType:
            "text/csv; charset=utf-8"

    };

};


// ==========================================
// Export
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