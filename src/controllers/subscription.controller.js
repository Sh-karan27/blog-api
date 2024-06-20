import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleFollower = asyncHandler(async (req, res) => {
  const { profileId } = req.params;

  if (!isValidObjectId(profileId)) {
    throw new ApiError(401, "please enter a valid id");
  }

  const userProfile = await User.findById(profileId).select(
    "username profileImage"
  );

  if (!userProfile) {
    throw new ApiError(401, "failed to fectch user profile");
  }

  if (req.user._id.toString() === profileId.toString()) {
    throw new ApiError(400, "You cannot follow to your own profile.");
  }

  const follower = await Subscription.findOne({
    follower: req.user?._id,
    following: profileId,
  });

  if (follower) {
    await Subscription.deleteOne({
      follower: req.user?._id,
      following: profileId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { following: false, userProfile },
          "unfollowed successfully"
        )
      );
  }

  const startedFollowing = await Subscription.create({
    follower: req.user?._id,
    following: profileId,
  });

  if (!startedFollowing) {
    throw new ApiError(400, "Unable to follow this user please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { following: true, userProfile },
        "you are now following this user"
      )
    );
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
