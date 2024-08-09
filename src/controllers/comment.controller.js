import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const getBlogComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { blogId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const limitOfVideo = parseInt(limit);
  const pageNumber = parseInt(page);

  const skip = (pageNumber - 1) * limitOfVideo;
  const pageSize = limitOfVideo;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Please enter a valid BlogId.");
  }

  const blogComments = await Comment.aggregate([
    {
      $match: {
        blog: new mongoose.Types.ObjectId(blogId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },

    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likeCount: 1,
        isLiked: 1,
        user: {
          _id: 1,
          username: 1,
          "profileImage.url": 1,
        },
      },
    },
    {
      $unwind: "$user",
    },
    {
      $skip: skip,
    },
    {
      $limit: pageSize,
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  if (!blogComments) {
    throw new ApiError(500, "Failed to get blog comments.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blogComments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { content } = req.body;

  // console.log("Request Body:", req.body); // Add this line

  console.log(content);

  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Enter a valid object id.");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required.");
  }

  const comment = await Comment.create({
    content,
    user: req.user?._id,
    blog: blogId,
  });

  if (!comment) {
    throw new ApiError(400, "Failed to post comment. Please try again.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Commented on blog successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Enter a valid object id.");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content cannot be empty.");
  }

  const newComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  if (!newComment) {
    throw new ApiError(500, "Failed to edit comment, please try again.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment edited successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Enter a valid commentId.");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment?.user.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment.");
  }

  await Comment.findByIdAndDelete(commentId);
  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (!deleteComment) {
    throw new ApiError(500, "Failed to delete comment try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted success fully!"));
});

export { getBlogComments, addComment, updateComment, deleteComment };
