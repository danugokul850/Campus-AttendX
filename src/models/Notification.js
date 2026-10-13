const mongoose = require("mongoose");

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // The user who receives this notification
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Notification content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Category of notification
    type: {
      type: String,
      enum: [
        "attendance",
        "subject",
        "announcement",
        "grievance",
        "system",
        "general",
      ],
      default: "general",
      required: true,
    },

    // Importance of notification
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Read/unread status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Optional frontend destination
    actionUrl: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    // Optional reference to a related record
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null,
    },

    // User who triggered the notification
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient notification retrieval for each user
notificationSchema.index({
  user: 1,
  createdAt: -1,
});

// Efficient unread notification queries
notificationSchema.index({
  user: 1,
  isRead: 1,
  createdAt: -1,
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

module.exports = Notification;