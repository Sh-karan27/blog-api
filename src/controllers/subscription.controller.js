import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleFollower = asyncHandler(async (req, res) => {
  const { profileId } = req.params;
  //toggle follower
});

const getUserProfileFollower = asyncHandler(async (req, res) => {
  const { profileId } = req.params;
  // controller to return subscriber list of a channel
});

const getUserProfileFollowing = asyncHandler(async (req, res) => {
  const { profileId } = req.params;
  // controller to return channel list to which user has subscribed
});

export { toggleFollower, getUserProfileFollower, getUserProfileFollowing };
