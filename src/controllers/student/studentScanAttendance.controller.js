const studentScanAttendanceService = require(
  "../../services/student/studentScanAttendance.service"
);

const scanAttendance = async (req, res, next) => {
  try {
    const {
      sessionId,
      window,
      qrToken,
    } = req.body;

    if (
      sessionId === undefined ||
      window === undefined ||
      qrToken === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "sessionId, window, and qrToken are required.",
      });
    }

    const result =
      await studentScanAttendanceService.scanAttendance({
        studentId: req.user.id,
        sessionId,
        window,
        qrToken,
      });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanAttendance,
};