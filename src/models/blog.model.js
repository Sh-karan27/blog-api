import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
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
    coverImage: {
      type: String, //cloudinary
      required: true,
    },
    view: {
      type: Number,
      default: 0,
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

blogSchema.plugin(mongooseAggregatePaginate);

export const Blog = mongoose.model("Blog", blogSchema);
