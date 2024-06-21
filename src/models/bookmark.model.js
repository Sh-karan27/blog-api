import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
    },
  },
  { timestamps: true }
);

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
