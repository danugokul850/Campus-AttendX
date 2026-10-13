const attendanceSessionService =
    require("../../services/attendanceSession.service");


// ==========================================
// Faculty creates attendance session
// ==========================================

const createAttendanceSession = async (
    req,
    res,
    next
) => {

    try {

        const {
            subjectId
        } = req.body;


        if (!subjectId) {

            return res.status(400).json({

                success: false,

                message: "subjectId is required"

            });

        }


        const result =
            await attendanceSessionService
                .createAttendanceSession({

                    facultyId:
                        req.user.id,

                    subjectId

                });


        return res.status(201).json({

            success: true,

            message:
                "Attendance session created successfully",

            data: result

        });

    } catch (error) {

        next(error);

    }
};


// ==========================================
// Faculty gets own attendance sessions
// ==========================================

const getMySessions = async (
    req,
    res,
    next
) => {

    try {

        const sessions =
            await attendanceSessionService
                .getMySessions(
                    req.user.id
                );


        return res.status(200).json({

            success: true,

            data: sessions

        });

    } catch (error) {

        next(error);

    }
};


// ==========================================
// Faculty gets one attendance session
// ==========================================

const getAttendanceSessionById = async (
    req,
    res,
    next
) => {

    try {

        const session =
            await attendanceSessionService
                .getAttendanceSessionById({

                    sessionId:
                        req.params.id,

                    facultyId:
                        req.user.id

                });


        return res.status(200).json({

            success: true,

            data: session

        });

    } catch (error) {

        next(error);

    }
};


// ==========================================
// Faculty gets attendance summary
// ==========================================

const getAttendanceSummary = async (
    req,
    res,
    next
) => {

    try {

        const summary =
            await attendanceSessionService
                .getAttendanceSummary({

                    sessionId:
                        req.params.id,

                    facultyId:
                        req.user.id

                });


        return res.status(200).json({

            success: true,

            message:
                "Attendance summary fetched successfully",

            data: summary

        });

    } catch (error) {

        next(error);

    }
};


// ==========================================
// Faculty manually closes session
// ==========================================

const closeAttendanceSession = async (
    req,
    res,
    next
) => {

    try {

        const session =
            await attendanceSessionService
                .closeAttendanceSession({

                    sessionId:
                        req.params.id,

                    facultyId:
                        req.user.id

                });


        return res.status(200).json({

            success: true,

            message:
                "Attendance session closed successfully",

            data: session

        });

    } catch (error) {

        next(error);

    }
};


// ==========================================
// Student marks attendance
// ==========================================

const markAttendance = async (
    req,
    res,
    next
) => {

    try {

        const attendance =
            await attendanceSessionService
                .markAttendance({

                    sessionId:
                        req.params.id,

                    studentId:
                        req.user.id

                });


        return res.status(201).json({

            success: true,

            message:
                "Attendance marked successfully",

            data: attendance

        });

    } catch (error) {

        next(error);

    }
};

// =====================================================
// MONTHLY ATTENDANCE REPORT
// =====================================================

const getMonthlyAttendanceReport = async (
    req,
    res,
    next
) => {

    try {

        const {
            subjectId,
            month,
            year
        } = req.query;


        const report =
            await attendanceSessionService
                .getMonthlyAttendanceReport({
                    subjectId,
                    month,
                    year,
                    facultyId: req.user.id
                });


        return res.status(200).json({

            success: true,

            message:
                "Monthly attendance report fetched successfully",

            data: report

        });

    } catch (error) {

        next(error);

    }
};

// =====================================================
// DOWNLOAD MONTHLY ATTENDANCE REPORT
// =====================================================

const downloadMonthlyAttendanceReport = async (
    req,
    res,
    next
) => {

    try {

        const {
            subjectId,
            month,
            year
        } = req.query;


        const report =
            await attendanceSessionService
                .downloadMonthlyAttendanceReport({

                    subjectId,

                    month,

                    year,

                    facultyId:
                        req.user.id

                });


        res.setHeader(
            "Content-Type",
            report.contentType
        );


        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${report.fileName}"`
        );


        return res.send(
            report.buffer
        );

    } catch (error) {

        next(error);

    }
};


// ==========================================
// Export controllers
// ==========================================

module.exports = {

    createAttendanceSession,

    getMySessions,

    getAttendanceSessionById,

    getAttendanceSummary,

    closeAttendanceSession,

    markAttendance,

    getMonthlyAttendanceReport,

    downloadMonthlyAttendanceReport

};