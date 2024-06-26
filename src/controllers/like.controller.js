import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Blog } from "../models/blog.model.js";

const toggleBlogLike = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(blogId)) {
    throw new ApiError(401, "enter valid blogId");
  }

  const like = await Like.findOne({
    likedBy: req.user?._id,
    blog: blogId,
  });

  if (like) {
    await Like.findByIdAndDelete(like?._id);
    return res.status(200).json(new ApiResponse(200, "unLiked Blog!"));
  }

  const liked = await Like.create({
    likedBy: req.user?._id,
    blog: blogId,
  });

  if (!liked) {
    throw new ApiError(500, "Failed to like blog");
  }

  return res.status(200).json(new ApiResponse(200, "BlogLiked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "enter a valid commentId");
  }
  const commentLike = await Like.findOne({
    likedBy: req.user?._id,
    comment: commentId,
  });

  if (commentLike) {
    await Like.findByIdAndDelete(commentLike?._id);
    return res.status(200).json(new ApiResponse(200, "unLiked comment!"));
  }

  const commentLiked = await Like.create({
    likedBy: req.user?._id,
    comment: commentId,
  });

  if (!commentLiked) {
    throw new ApiError(500, "failed to like comment try again");
  }

  return res.status(200).json(new ApiResponse(200, "comment Liked!"));
});

const getLikedBlog = asyncHandler(async (req, res) => {
  const likedBlog = await Like.aggregate([
    {
      $match: {
        likedBy: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "blogs",
        localField: "blog",
        foreignField: "_id",
        as: "likedBlogs",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
              pipeline: [
                {
                  $project: {
                    _id: 0,
                    username: 1,
                    "profileImage.url": 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              author: "$author",
            },
          },
          {
            $unwind: "$author",
          },
          {
            $project: {
              title: 1,
              description: 1,
              author: 1,
              "coverImage.url": 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likedBlogs: "$likedBlogs",
      },
    },

    {
      $project: {
        _id: 0,
        likedBlogs: 1,
      },
    },
  ]);
  if (!likedBlog) {
    throw new ApiResponse(500, "failed to get likedBlogs try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likedBlog, "Liked blogs fetched successfully"));
});

export { toggleBlogLike, toggleCommentLike, getLikedBlog };