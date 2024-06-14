import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    view: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
    },
    tag: {
      type: [String],
    },
  },
  { timestamps: true }
);

export const Blog = mongoose.model("Blog", blogSchema);
