const mongoose = require('mongoose');
const { Schema } = mongoose;

const otpSchema = new Schema({
    phone: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ["account-recovery", "login-verification"],
        default: "account-recovery"
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // TTL: auto-deletes document 300 seconds (5 min) after createdAt
    }
});

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;