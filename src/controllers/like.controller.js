import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";

const toggleBlogLike = asyncHandler(async (req, res) => {
  const { blogId } = req.params;
    //TODO: toggle like on video
    
    if (!isValidObjectId(blogId)) {
        
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const getLikedBlog = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleBlogLike, toggleCommentLike, getLikedBlog };
