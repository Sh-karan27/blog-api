import mongoose, { isValidObjectId, mongo } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleFollower = asyncHandler(async (req, res) => {
  const { profileId } = req.params;

  if (!isValidObjectId(profileId)) {
    throw new ApiError(400, "Please enter a valid profileId");
  }

  const userProfile = await User.findById(profileId).select(
    "username profileImage.url"
  );

  if (!userProfile) {
    throw new ApiError(500, "Failed to fetch user profile");
  }

  if (req.user._id.toString() === profileId.toString()) {
    throw new ApiError(404, "You cannot follow to your own profile.");
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
    throw new ApiError(500, "Unable to follow this user please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { following: true, userProfile },
        "You are now following this user"
      )
    );
});

const getUserProfileFollower = asyncHandler(async (req, res) => {
  let { profileId } = req.params;
  profileId = new mongoose.Types.ObjectId(profileId);
  if (!isValidObjectId(profileId)) {
    throw new ApiError(400, "Enter a valid profileId");
  }

  const follower = await Subscription.aggregate([
    {
      $match: {
        following: profileId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        as: "follower",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "following",
              as: "followedToFollower",
            },
          },
          {
            $addFields: {
              followedToFollower: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$followedToFollower.follower"],
                  },
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
              followedToFollower: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        follower: {
          $arrayElemAt: ["$follower", 0],
        },
      },
    },
    {
      $project: {
        _id: 0,
        follower: 1,
      },
    },
  ]);
  // controller to return subscriber list of a channel
  if (!follower) {
    throw new ApiError(500, "Failed to get user followers");
  }

  const followerList = follower.map((currVal) => currVal.follower);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { followerCount: followerList.length, followerList },
        "User profile follower fetched successfully"
      )
    );
});

const getUserProfileFollowing = asyncHandler(async (req, res) => {
  let { profileId } = req.params;
  // controller to return channel list to which user has subscribed
  profileId = new mongoose.Types.ObjectId(profileId);

  if (!isValidObjectId(profileId)) {
    throw new ApiError(400, "Enter a valid profileId");
  }

  const following = await Subscription.aggregate([
    {
      $match: {
        follower: profileId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "following",
        foreignField: "_id",
        as: "following",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "follower",
              as: "followingUs",
            },
          },
          {
            $addFields: {
              followingUs: {
                $cond: {
                  if: { $in: [req.user?._id, "$followingUs.following"] },
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
              followingUs: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        following: { $arrayElemAt: ["$following", 0] },
      },
    },
    {
      $project: {
        _id: 0,
        following: 1,
      },
    },
  ]);
  if (!following) {
    throw new ApiError(500, "Failed to get UserProfile following");
  }

  const followingList = following.map((currVal) => currVal.following);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { followingCount: following.length, followingList },
        "user profile following fetched successfully"
      )
    );
});

export { toggleFollower, getUserProfileFollower, getUserProfileFollowing };
