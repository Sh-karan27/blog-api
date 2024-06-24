import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { Blog } from "../models/blog.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (name.trim() === "") {
    throw new ApiError(401, "Name field is Empty");
  }
  if (description.trim() === "") {
    throw new ApiError(401, "Name field is Empty");
  }

  const playList = await Playlist.create({
    name,
    description,
    user: req.user?._id,
  });

  if (!playList) {
    throw new ApiError(401, "Name field is Empty");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "PlayList created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "Enter valid playlistId");
  }

  const playList = await Playlist.findById(playlistId);

  if (!playList) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "Fetch playlist by id"));
});

const addBlogToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
});

const removeBlogFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "Enter valid PlaylistId");
  }

  const playList = await Playlist.findById(playlistId);

  if (!playList) {
    throw new ApiError(404, "playlist not found");
  }

  if (playList?.user.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      404,
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
    throw new ApiError(401, "Enter valid playlist Id");
  }
  if (name.trim() === "") {
    throw new ApiError(401, "Name field is Empty");
  }
  if (description.trim() === "") {
    throw new ApiError(401, "Description field is Empty");
  }

  const playList = await Playlist.findById(playlistId);

  if (!playList) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playList?.user.toString() !== req.user?._id.toString()) {
    throw new ApiError(404, "cant upload playlist you are not the owen");
  }

  const updatedPlayList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: { name, description },
    },
    { new: true }
  );

  if (!updatePlaylist) {
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
