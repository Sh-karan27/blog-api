import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Blog } from "../models/blog.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";

async function deleteCommentsLikesPlaylistWatchHistoryAndBookmarkForBlogId(
  blogId
) {
  try {
    const likeDelete = await Like.deleteMany({ blog: blogId });
    const getComments = await Comment.find({ blog: blogId });
    const commentId = getComments.map((comment) => comment._id);
    const delteCommentLike = await Like.deleteMany({
      comment: { $in: commentId },
    });
    const deleteCommnets = await Comment.deleteMany({ blog: blogId });
    const deleteBlogFromPlaylist = Playlist.updateMany(
      {},
      {
        $pull: {
          blog: blogId,
        },
      }
    );

    const removeFromWatchHistoryAndBookmarks = await User.updateMany(
      {},
      {
        $pull: { watchHistory: blogId, bookmarks: blogId },
      }
    );

    await Promise.all([
      likeDelete,
      getComments,
      commentId,
      delteCommentLike,
      deleteCommnets,
      deleteBlogFromPlaylist,
      removeFromWatchHistoryAndBookmarks,
    ]);

    return true;
  } catch (error) {
    console.error(
      "Error deleting likes, comments, playlist entries, and watch history for video:",
      error
    );
    throw error;
  }
}

const getAllBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  const limitOfVideo = parseInt(limit);
  const pageNumber = parseInt(page);

  const skip = (pageNumber - 1) * limitOfVideo;
  const pageSize = limitOfVideo;

  const pipeline = [];

  if (!query) {
    throw new ApiError(401, "Please enter a query");
  }

  //pipeline to match the text seacrh query
  pipeline.push({
    $match: {
      $or: [
        {
          title: {
            $regex: query,
            $options: "i",
          },
        },
        {
          description: {
            $regex: query,
            $options: "i",
          },
        },
      ],
      published: true,
    },
  });

  //pipeline to sort blog search
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  // pipeline for searched blog author details
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "authorDetails",
      pipeline: [
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "following",
            as: "followers",
          },
        },
        {
          $addFields: {
            followers: {
              $size: "$followers",
            },
            following: {
              $cond: {
                if: { $in: [req.user?._id, "$followers.follower"] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            username: 1,
            "profileImage.url": 1,
            followers: 1,
            following: 1,
          },
        },
      ],
    },
  });

  //pipeline to get likes on seached blog
  pipeline.push({
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "blog",
      as: "likes",
    },
  });

  //pipeline to get comment on seached blog
  pipeline.push({
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "blog",
      as: "comments",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $addFields: {
            user: "$user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: 0,
            user: {
              username: 1,
              "profileImage.url": 1,
            },
            content: 1,
          },
        },
      ],
    },
  });

  // pipeline to addfields unwind and project
  pipeline.push(
    {
      $addFields: {
        commentCount: {
          $size: "$comments",
        },
        comments: "$comments",

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
      $unwind: "$authorDetails",
    },
    {
      $project: {
        _id: 0,
        authorDetails: 1,
        title: 1,
        description: 1,
        content: 1,
        "coverImage.url": 1,
        views: 1,
        isLiked: 1,
        likeCount: 1,
        comments: 1,
        commentCount: 1,
      },
    },
    {
      $skip: skip,
    },

    {
      $limit: pageSize,
    }
  );

  const blogArggregate = await Blog.aggregate(pipeline);
  if (!blogArggregate) {
    throw new ApiError(500, "Failed to fetch blogs, try again.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blogArggregate, "Blogs fetched successfully"));
});

const publishBlog = asyncHandler(async (req, res) => {
  const { title, description, content, tag } = req.body;

  if ([title, description, content].some((field) => field.trim() === "")) {
    throw new ApiError(401, "All fields are required");
  }

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(
      404,
      "Failed to upload cover image to Cloudinary. Please try again."
    );
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
    throw new ApiError(500, "Failed to upload blog. Please try again.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "blog uploaded successfullyy"));
});

const getBlogById = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Enter a valid blogId.");
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
    throw new ApiError(404, "Failed to get blog. Please try again.");
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
    .json(new ApiResponse(200, blog, "Blog fetched successfully"));
});

const updateBlog = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Enter a valid blogId.");
  }

  // update blog title description coverImage like details

  const { title, description, content } = req.body;

  if (!(title || description || content)) {
    throw new ApiError(
      400,
      "At least one of the fields (title, description, content, status) is required."
    );
  }

  const oldBlog = await Blog.findById(blogId);

  if (!oldBlog) {
    throw new ApiError(500, "Failed to retrieve old blog.");
  }

  if (oldBlog.author.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You cannot edit this blog since you are not the author."
    );
  }

  const oldCoverImage = oldBlog?.coverImage?.public_id;

  if (!oldCoverImage) {
    throw new ApiError(
      404,
      "Failed to fetch old cover image. Public ID path is required."
    );
  }

  const deleteOldCoverImage = await deleteFromCloudinary(oldCoverImage);

  if (!deleteOldCoverImage) {
    throw new ApiError(
      404,
      "Failed to delete old cover image from Cloudinary."
    );
  }

  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage path is required");
  }
  const newCoverImage = await uploadOnCloudinary(req.file?.path);

  if (!newCoverImage) {
    throw new ApiError(500, "Failed to upload cover image to Cloudinary.");
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    blogId,
    {
      $set: {
        title,
        description,
        content,
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
    throw new ApiError(
      404,
      "Failed to update blog. Blog not found or update operation failed."
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBlog, "blog updated successfully"));
});

const deleteBlog = asyncHandler(async (req, res) => {
  //delete blog by id
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Enter a valid blogId.");
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "Blog not found.");
  }

  if (blog.author.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You cannot delete this blog since you are not the author."
    );
  }
  const deleteBlog = await Blog.findByIdAndDelete(blogId);

  if (!deleteBlog) {
    throw new ApiError(500, "Failed to delete blog. Please try again.");
  }

  const deleteLikes =
    await deleteCommentsLikesPlaylistWatchHistoryAndBookmarkForBlogId(blogId);

  if (!deleteLikes) {
    throw new ApiError(500, "Failed to delete likes and comments for blog.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Blog deleted successfully"));
});

const toggleStatus = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Invalid blogId");
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "Blog not found.");
  }

  if (blog?.author.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to edit this blog.");
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
        new ApiResponse(200, publishBlog, "Toggle blog status successfully")
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
    throw new ApiError(404, "Failed to toggle blog status.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, publishBlog, "Toggle blog status successfully"));
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
