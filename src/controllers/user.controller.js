import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deletFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wring while gentrating refresh& access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user deatails form frontend
  //validation - not empty
  // check if user already exist: username, email
  //check for images, check for avtar
  //upload them to cloudinary, avatar
  // create user object - create and entry in db
  //remove password and refres token field
  //check for user creation
  //retunr resm

  const { username, email, password, bio } = req.body;

  if ([username, password, email].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fileds are required");
  }

  const userExist = await User.findOne({ $or: [{ username }, { email }] });

  if (userExist) {
    throw new ApiError(409, "user with username or email already exit");
  }

  const profileImagelocalPath = req.files?.profileImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!profileImagelocalPath) {
    throw new ApiError(400, "profile image is required");
  }

  const profileImage = await uploadOnCloudinary(profileImagelocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!profileImage) {
    throw new ApiError(400, "profile image is required");
  }
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    profileImage: profileImage.url,
    coverImage: coverImage?.url || "",
    bio,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to register user try again ");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user resgisted!!"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body ->
  //username or email
  // find the user
  // password check
  //access and refresh token
  //send cookie

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or password is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(400, "user not found please register");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid password");
  }

  const { refreshToken, accessToken } = await genrateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in success fully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refreshToken ");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, " refreshToken is expired or used ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!(oldPassword || newPassword)) {
    throw new ApiError(401, "Both password are required");
  }

  const user = await User.findById(req.user?._id);

  const correctPassword = user.isPasswordCorrect(oldPassword);

  if (!correctPassword) {
    throw new ApiError(400, "invalid password try again");
  }
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched succesfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email } = req.body;

  if (!(username || email)) {
    throw new ApiError(401, "all fields are require");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        email,
        username,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // const deleteOldProfile = await deletFromCloudinary(req.user?.profileImage);

  // if (!deleteOldProfile) {
  //   throw new ApiError(401, "Failed to delete old profile from cloudinary");
  // }

  const profileLocalPath = req.file?.path;
  if (!profileLocalPath) {
    throw new ApiError(401, "profile file is missing");
  }

  const profileImage = await uploadOnCloudinary(profileLocalPath);

  if (!profileImage.url) {
    throw new ApiError(404, "error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profileImage: profileImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "profile changed successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {});

const getUserChannelProfile = asyncHandler(async (req, res) => {});

const getWatchHistory = asyncHandler(async (req, res) => {});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
