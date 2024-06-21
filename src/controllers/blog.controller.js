import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Blog } from "../models/blog.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Like } from "../models/like.model.js";

const getAllBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

const publishBlog = asyncHandler(async (req, res) => {
  const { title, description, content, tag } = req.body;

  if ([title, description, content].some((field) => field.trim() === "")) {
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
  if (!isValidObjectId(blogId)) {
    throw new ApiError(401, "enter valid blogId");
  }

  const blog = await Blog.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(blogId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "blog",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "blog",
        as: "comment",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "following",
              as: "follower",
            },
          },
          {
            $addFields: {
              followerCount: {
                $size: "$follower",
              },
              isFollowing: {
                $cond: {
                  if: { $in: [req.user?._id, "$follower.follower"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "profileImage.url": 1,
              followerCount: 1,
              isFollowing: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likeCounts: {
          $size: "$likes",
        },
        author: {
          $first: "$author",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
        commet: {
          $size: "$comment",
        },
      },
    },
    {
      $project: {
        "coverImage.url": 1,
        title: 1,
        description: 1,
        content: 1,
        views: 1,
        author: 1,
        likeCounts: 1,
        isLiked: 1,
        status: 1,
        createdAt: 1,
        commet: 1,
      },
    },
  ]);

  if (!blog) {
    throw new ApiError(500, "failed to get blog please try again");
  }
  await Blog.findByIdAndUpdate(blogId, {
    $inc: { views: 1 },
  });
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: blogId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "blog fetched successfully"));
});

const updateBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(401, "enter valid blogId");
  }

  // update blog title description coverImage like details

  const { title, description, content, coverImage, status } = req.body;

  if (!(title || description || content || status)) {
    throw new ApiError(401, "all fields are required");
  }

  const oldBlog = await Blog.findById(blogId);
  if (!oldBlog) {
    throw new ApiError(500, "failed get old blog ");
  }
  if (oldBlog.author.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      404,
      "you cant edit this blog since you are not the author"
    );
  }

  const oldCoverImage = oldBlog?.coverImage?.public_id;

  if (!oldCoverImage) {
    throw new ApiError(
      404,
      "failed to fetch oldCoverImage publick id path required"
    );
  }

  const deleteOldCoverImage = await deleteFromCloudinary(oldCoverImage);

  if (!deleteOldCoverImage) {
    throw new ApiError(404, "failed to delete old coverImage");
  }

  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(404, "coverImage path required");
  }
  const newCoverImage = await uploadOnCloudinary(req.file?.path);
  if (!newCoverImage) {
    throw new ApiError(500, "failed to update coverImage try again");
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    blogId,
    {
      $set: {
        title,
        description,
        content,
        status,
        coverImage: {
          public_id: newCoverImage.public_id,
          url: newCoverImage.url,
        },
      },
    },
    {
      new: true,
    }
  );

  if (!updatedBlog) {
    throw new ApiError(500, "Failed to update blog try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBlog, "blog updated successfully"));
});

const deleteBlog = asyncHandler(async (req, res) => {
  //delete blog by id
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(401, "Enter a valid blogId ");
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(500, "blog doesnt exist");
  }

  if (blog.author.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      404,
      "You cant delete this blog since you are not the author"
    );
  }
  const deleteBlog = await Blog.findByIdAndDelete(blogId);
  if (!deleteBlog) {
    throw new ApiError(404, "Failed to delete video try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully"));
});

const toggleStatus = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(401, "Invalid blogId");
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "blog doesnt exist");
  }

  if (blog?.author.toString() !== req.user?._id.toString()) {
    throw new ApiError(404, "Your are not the author you cannot edit blog ");
  }

  if (blog?.published === true) {
    const publishBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        $set: {
          published: false,
        },
      },
      {
        new: true,
      }
    ).select("title description coverImage author published");

    return res
      .status(200)
      .json(
        new ApiResponse(200, publishBlog, "toggle blog status successfully")
      );
  }

  const publishBlog = await Blog.findByIdAndUpdate(
    blogId,
    {
      $set: {
        published: true,
      },
    },
    {
      new: true,
    }
  ).select("title description coverImage author published");
  if (!publishBlog) {
    throw new ApiError(500, "Failed to toggle blog status");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, publishBlog, "toggle blog status successfully"));
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
