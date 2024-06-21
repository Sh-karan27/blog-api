import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Blog } from "../models/blog.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

const publishBlog = asyncHandler(async (req, res) => {
  const { title, description, content, status, tag } = req.body;

  if (
    [title, description, content, status].some((field) => field.trim() === "")
  ) {
    throw new ApiError(401, "All fields are required");
  }

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(401, "coverImage is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(404, "Failed to upload coverImage try again");
  }

  const blog = await Blog.create({
    author: req.user?._id,
    title,
    description,
    content,
    status,
    coverImage: {
      public_id: coverImage.public_id,
      url: coverImage.url,
    },
    tag,
  });
  const blogUploaded = await Blog.findById(blog?._id);
  if (!blogUploaded) {
    throw new ApiError(500, "failed to upload blog try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "blog uploaded successfullyy"));
});

const getBlogById = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  //Todo: get blog byy id
});

const updateBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  // update blog title description coverImage like details
});

const deleteBlog = asyncHandler(async (req, res) => {
  //delete blog by id
});

const toggleStatus = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  //change the status
});

export {
  getAllBlogs,
  publishBlog,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleStatus,
};
