import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { Blog } from "../models/blog.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (name.trim() === "") {
    throw new ApiError(400, "Name field is empty.");
  }
  if (description.trim() === "") {
    throw new ApiError(400, "Description field is empty.");
  }

  const playList = await Playlist.create({
    name,
    description,
    user: req.user?._id,
  });

  if (!playList) {
    throw new ApiError(500, "Failed to create playlist.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Enter a valid userId");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "blogs",
        localField: "blog",
        foreignField: "_id",
        as: "blogs",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "authorDetails",
              pipeline: [
                {
                  $project: {
                    _id: 0,
                    username: 1,
                    "profileImage.url": 1,
                  },
                },
              ],
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
            $addFields: {
              authorDetails: "$authorDetails",
              likeCount: {
                $size: "$likes",
              },
            },
          },
          {
            $unwind: "$authorDetails",
          },
        ],
      },
    },
    {
      $addFields: {
        blogs: "$blogs",
        totalBlogs: { $size: "$blogs" },
        totalViews: { $size: "$blogs.views" },
      },
    },
    // {
    //   $unwind: "$blogs",
    // },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalViews: 1,
        totalBlogs: 1,
        createdAt: 1,
        blogs: {
          title: 1,
          description: 1,
          content: 1,
          "coverImage.url": 1,
          authorDetails: 1,
          likeCount: 1,
          views: 1,
          createdAt: 1,
        },
      },
    },
  ]);

  // const userPlaylist = await Playlist.find({
  //   user: userId,
  // });

  if (!userPlaylist) {
    throw new ApiError(500, "Failed to get user playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "User playlist fetched"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Enter valid playlistId");
  }

  // Aggregating playlist details and blogs
  const playlistData = await Playlist.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },
    {
      $lookup: {
        from: "blogs",
        localField: "blog",
        foreignField: "_id",
        as: "blogs",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true, // Ensures the owner field is not mandatory
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        blogs: {
          $filter: {
            input: "$blogs",
            as: "blog",
            cond: { $eq: ["$$blog.published", true] },
          },
        },
        owner: {
          username: 1,
          "profileImage.url": 1,
        },
      },
    },
  ]);

  // Check if playlist data is found
  if (!playlistData.length) {
    throw new ApiError(404, "Playlist not found");
  }

  // If no blogs are published, the 'blogs' field will be an empty array
  const playlist = playlistData[0];
  if (!playlist.blogs) {
    playlist.blogs = []; // Ensure blogs is always an array
  }

  // Returning playlist details along with associated blogs
  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Fetch playlist by id"));
});


const addBlogToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, blogId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Enter valid playlistId");
  }
  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Enter valid blogId");
  }

  const playlist = await Playlist.findById(playlistId);
  const blog = await Blog.findById(blogId);

  const blogsInPlaylist = playlist?.blog;

  if (blogsInPlaylist?.includes(blogId)) {
    throw new ApiError(404, " Blog already exist in playlist ");
  }
  if (!playlist) {
    throw new ApiError(404, " Playlist not found");
  }
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  const addBlog = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $addToSet: { blog: blogId },
    },
    { new: true }
  );

  if (!addBlog) {
    throw new ApiError(500, "Failed to add blog in playlist, try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, addBlog, "Blog added to playlist successfully"));
});

const removeBlogFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, blogId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Enter valid playlist id");
  }
  if (!isValidObjectId(blogId)) {
    throw new ApiError(400, "Enter valid blogId");
  }

  const playlist = await Playlist.findById(playlistId);
  const blog = await Blog.findById(blogId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  if (playlist?.user.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You are not the owner of the playlist you cant remove this blog"
    );
  }

  if (playlist?.blog.includes(blogId) === false) {
    throw new ApiError(404, "Blog does not exist in this playlist");
  }

  const updatedPlayList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        blog: blogId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlayList) {
    throw new ApiError(500, "Failed to remove blog from playlist, tr again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlayList,
        "Blog removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Enter valid PlaylistId");
  }

  const playList = await Playlist.findById(playlistId);

  if (!playList) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playList?.user.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "Cant delete playlist,You are not the owner of this playList"
    );
  }

  const deletePlayList = await Playlist.findByIdAndDelete(playlistId);

  if (!deletePlayList) {
    throw new ApiError(500, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist delete Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Enter valid playlist Id");
  }
  if (!name) {
    throw new ApiError(400, "Name field is Empty");
  }
  if (!description) {
    throw new ApiError(400, "Description field is Empty");
  }

  const playList = await Playlist.findById(playlistId);

  if (!playList) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playList?.user.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Cannot update playlist, you are not the owner");
  }

  const updatedPlayList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: { name, description },
    },
    { new: true }
  );

  if (!updatedPlayList) {
    throw new ApiError(500, "Failed to update playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlayList, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addBlogToPlaylist,
  removeBlogFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
