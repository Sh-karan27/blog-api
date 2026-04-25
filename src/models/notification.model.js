import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["FOLLOW", "LIKE", "COMMENT", "POST"],
      required: true,
    },

    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index(
  { recipient: 1, sender: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "FOLLOW" },
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
