const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        minlength: 3,
        maxlength: 20,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    emailId: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["student", "faculty", "admin"],
        default: "student",
        index: true
    },

    // =========================
    // STUDENT INFORMATION
    // =========================

    registrationNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // allows faculty/admin to have no registrationNumber without breaking uniqueness
        required: function () { return this.role === "student"; }
    },
    department: {
        type: mongoose.Schema.Types.ObjectId, // e.g. SFET
        ref: "Department",
        required: function () { return this.role === "student"; }
    },
    branch: {
        type: String,
        required: function () { return this.role === "student"; },
        enum: ["CE", "AI/ML", "ECE", "ME"], // update with your university's actual branches
        uppercase: true,
        trim: true
    },
    batch: {
        type: Number,
        required: function () { return this.role === "student"; },
        min: 2000,
        max: 2100,
        index: true
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        required: function () { return this.role === "student"; }
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    // =========================
    // PROFILE
    // =========================

    profileImage: {
        type: String,
        default: null,
    },

    // =========================
    // LOGIN INFORMATION
    // =========================

    lastLogin: {
        type: Date,
        default: null,
    },

}, { timestamps: true });

// Compound index for common attendance queries: department + branch + batch + semester
userSchema.index({ department: 1, branch: 1, batch: 1, semester: 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;