const mongoose = require("mongoose");

const User = require("../../models/User");
const Subject = require("../../models/Subject");
const AttendanceSession = require(
  "../../models/AttendanceSession"
);
const Attendance = require("../../models/Attendance");

const {
  validateDynamicQrPayload,
} = require("../../utils/dynamicQr");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const scanAttendance = async ({
  studentId,
  sessionId,
  window,
  qrToken,
}) => {
  // 1. Validate student ID.
  if (!mongoose.isValidObjectId(studentId)) {
    throw createError("Invalid student ID.", 400);
  }

  // 2. Validate session ID.
  if (!mongoose.isValidObjectId(sessionId)) {
    throw createError("Invalid attendance session ID.", 400);
  }

  // 3. Validate the rotating QR token.
  const validQr = validateDynamicQrPayload({
    sessionId,
    window,
    qrToken,
  });

  if (!validQr) {
    throw createError(
      "QR code is invalid or expired. Please scan the latest QR code.",
      400
    );
  }

  // 4. Find the authenticated student.
  const student = await User.findOne({
    _id: studentId,
    role: "student",
    isActive: true,
  });

  if (!student) {
    throw createError(
      "Student account not found or inactive.",
      404
    );
  }

  // 5. Find the attendance session.
  const session = await AttendanceSession.findById(
    sessionId
  ).populate("subject");

  if (!session) {
    throw createError(
      "Attendance session not found.",
      404
    );
  }

  // 6. Verify session status.
  if (session.status !== "active") {
    throw createError(
      "This attendance session is no longer active.",
      400
    );
  }

  // 7. Verify session expiration.
  const now = new Date();

  if (session.expiresAt <= now) {
    // Update the status if the session has expired.
    await AttendanceSession.updateOne(
      {
        _id: session._id,
        status: "active",
      },
      {
        $set: {
          status: "expired",
        },
      }
    );

    throw createError(
      "Attendance session has expired.",
      400
    );
  }

  // 8. Check the session subject.
  const subject = session.subject;

  if (!subject || !subject.isActive) {
    throw createError(
      "This subject is not available for attendance.",
      400
    );
  }

  if (
    subject.status !== "approved" ||
    subject.course !== student.course ||
    subject.branch !== student.branch ||
    subject.semester !== student.semester
  ) {
    throw createError(
      "You are not eligible to attend this subject.",
      403
    );
  }

  // 9. Prevent duplicate attendance.
  const existingAttendance = await Attendance.findOne({
    session: session._id,
    student: student._id,
  });

  if (existingAttendance) {
    throw createError(
      "Your attendance has already been recorded for this session.",
      409
    );
  }

  // 10. Save attendance.
  try {
    const attendance = await Attendance.create({
      session: session._id,
      student: student._id,
      markedAt: now,
      status: "present",
    });

    return {
      attendanceId: attendance._id,
      status: attendance.status,
      markedAt: attendance.markedAt,

      session: {
        sessionId: session._id,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
      },

      message: "Attendance marked successfully.",
    };
  } catch (error) {
    // The Attendance collection should have a unique index
    // on { session: 1, student: 1 }.
    if (error.code === 11000) {
      throw createError(
        "Your attendance has already been recorded for this session.",
        409
      );
    }

    throw error;
  }
};

module.exports = {
  scanAttendance,
};