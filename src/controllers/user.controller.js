import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  const { username, email, password } = req.body;
  console.log(username, email, password);
  if ([username, password, email].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fileds are required");
  }

  const userExist = await User.findOne({ $or: [{ username }, { email }] });

  if (userExist) {
    throw new ApiError(409, "user with username or email already exit");
  }

  const profileImagelocalPath = req.files?.profileImage[0]?.path;
  console.log(req.files);
  const coverImageLocalPath = req.files?.coverImage[0].path;

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

export { registerUser };
