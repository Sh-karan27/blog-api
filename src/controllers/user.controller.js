import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  if (!username || !email) {
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
    user?._id
  );

  const loggedInUser = await User.findById(user?._id).select(
    "-password -refreshToken"
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
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in success fully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {});

export { registerUser, loginUser };
