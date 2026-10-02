const mongoose = require("mongoose");

const { Schema } = mongoose;

const attendanceSchema = new Schema(
    {
        session: {
            type: Schema.Types.ObjectId,
            ref: "AttendanceSession",
            required: true,
            index: true
        },

        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        markedAt: {
            type: Date,
            default: Date.now,
            required: true
        },

        status: {
            type: String,
            enum: ["present"],
            default: "present"
        }
    },
    {
        timestamps: true
    }
);

/*
Prevent the same student
from being marked twice
in the same session.
*/
attendanceSchema.index(
    {
        session: 1,
        student: 1
    },
    {
        unique: true
    }
);

const Attendance = mongoose.model(
    "Attendance",
    attendanceSchema
);

module.exports = Attendance;