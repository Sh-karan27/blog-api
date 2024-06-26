import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Blog } from "../models/blog.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

const getUserBookmarks = asyncHandler(async (req, res) => {
  //get user bookmarks
  const { userId } = req.params;
});
const toggleBoookmark = asyncHandler(async (req, res) => {
  const { blogId } = req.params;

  if (!isValidObjectId(blogId)) {
    throw new ApiError(401, "enter valid blog id");
  }
  const blog = Blog.findById(blogId);

  if (!blog) {
    throw new ApiError(401, " blog not found");
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
    throw new ApiError(500, "failed to add bookmark try again");
  }

  return res.status(200).json(new ApiResponse(200, "Bookmark added"));
});

export { getUserBookmarks, toggleBoookmark };
