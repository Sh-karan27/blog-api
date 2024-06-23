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

  if (!isValidObjectId(blogId)) {
    throw new ApiError(404, "Please enter valid BlogId");
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
          username: 1,
          "profileImage.url": 1,
        },
      },
    },
    {
      $unwind: "$user",
    },
  ]);

  if (!blogComments) {
    throw new ApiResponse(500, "Failed to get blog comments");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blogComments, "comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(404, "Enter valid object id");
  }

  if (content.trim() === "") {
    throw new ApiError(404, "content required");
  }

  const comment = await Comment.create({
    content,
    user: req.user?._id,
    blog: blogId,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to comment try again");
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
    throw new ApiError(404, "Enter valid object id");
  }

  if (content.trim() === "") {
    throw new ApiError(404, "Content is empty");
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
    throw new ApiError(500, "Failed to edit comment, try again!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment edited successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "Enter valid ");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment?.user.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      404,
      "Comment cant delete this commengt since you are not the owner"
    );
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
