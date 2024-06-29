import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Blog } from "../models/blog.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import mongoose, { isValidObjectId, mongo } from "mongoose";
import { User } from "../models/user.model.js";

const getUserBookmarks = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "blogs",
        localField: "bookmarks",
        foreignField: "_id",
        as: "bookmarks",
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
                    profileImage: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              author: {
                $first: "$author",
              },
            },
          },
          {
            $project: {
              _id: 0,
              title: 1,
              description: 1,
              coverImage: 1,
              views: 1,
              author: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    throw new ApiError(500, "Failed to fetch user bookmarks");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].bookmarks,
        "User bookmarks fetched successfully"
      )
    );
});

const toggleBoookmark = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Enter valid blog id.");
  }
  const blog = Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(401, "Blog not found.");
  }

  const bookmarkExist = await Bookmark.findOne({
    user: req.user?._id,
    blog: blogId,
  });

  if (bookmarkExist) {
    await Bookmark.findByIdAndDelete(bookmarkExist?._id);
    await User.findByIdAndUpdate(req.user?._id, {
      $pull: {
        bookmarks: blogId,
      },
    });
    return res.status(200).json(new ApiResponse(200, "Bookmark removed!"));
  }
  await Bookmark.create({
    user: req.user?._id,
    blog: blogId,
  });

  const addBookmark = await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      bookmarks: blogId,
    },
  });
  if (!addBookmark) {
    throw new ApiError(500, "Failed to add bookmark. Please try again.");
  }

  return res.status(200).json(new ApiResponse(200, "Bookmark added"));
});

export { getUserBookmarks, toggleBoookmark };
