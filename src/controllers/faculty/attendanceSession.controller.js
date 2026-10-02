const attendanceSessionService =
    require("../../services/attendanceSession.service");


/*
    Faculty creates attendance session
*/
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
                    facultyId: req.user.id,
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


/*
    Faculty gets own sessions
*/
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


/*
    Faculty gets one session
*/
const getAttendanceSessionById = async (
    req,
    res,
    next
) => {

    try {

        const session =
            await attendanceSessionService
                .getAttendanceSessionById({

                    sessionId: req.params.id,

                    facultyId: req.user.id

                });


        return res.status(200).json({

            success: true,

            data: session

        });

    } catch (error) {

        next(error);

    }
};


/*
    Faculty closes session
*/
const closeAttendanceSession = async (
    req,
    res,
    next
) => {

    try {

        const session =
            await attendanceSessionService
                .closeAttendanceSession({

                    sessionId: req.params.id,

                    facultyId: req.user.id

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


/*
    Student marks attendance
*/
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


module.exports = {

    createAttendanceSession,

    getMySessions,

    getAttendanceSessionById,

    closeAttendanceSession,

    markAttendance

};