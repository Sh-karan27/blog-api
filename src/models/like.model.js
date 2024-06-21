import mongoose, { Schema, mongo } from "mongoose";

const likeSchema = new Schema(
  {
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
