import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createNotification = asyncHandler(async (req, res) => {
  const { recipient, type, post, comment } = req.body;

  if (!recipient || !type) {
    throw new ApiError(400, "Recipient and type are required");
  }

  const notification = await Notification.create({
    recipient,
    sender: req.user._id,
    type,
    post: post || null,
    comment: comment || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, notification, "Notification created"));
});

export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const notifications = await Notification.find({
    recipient: userId,
  })
    .populate("sender", "username profileImage.url")
    .populate("post", "title coverImage.url")
    .sort({ createdAt: -1 }) // latest first
    .limit(20); // pagination later

  const totalCount = await Notification.countDocuments({
    recipient: userId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount,
        notifications,
      },
      "Notifications fetched successfully"
    )
  );
});

export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { count }, "Unread notification count fetched"));
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Notification.findByIdAndUpdate(id, {
    isRead: true,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Marked as read"));
});

export const getNotificationsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const notifications = await Notification.find({
    recipient: userId,
  })
    .populate("sender", "username profileImage.url")
    .populate("post", "title coverImage.url")
    .sort({ createdAt: -1 });

  const totalCount = await Notification.countDocuments({
    recipient: userId,
  });

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount,
        unreadCount,
        notifications,
      },
      "User notifications fetched successfully"
    )
  );
});

export const getNotificationsByStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // 🔐 optional security (recommended)
  if (req.user._id.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }

  // ⚡ Fetch both in parallel
  const [unreadNotifications, readNotifications] = await Promise.all([
    Notification.find({
      recipient: userId,
      isRead: false,
    })
      .populate("sender", "username profileImage.url")
      .populate("post", "title coverImage.url")
      .sort({ createdAt: -1 }),

    Notification.find({
      recipient: userId,
      isRead: true,
    })
      .populate("sender", "username profileImage.url")
      .populate("post", "title coverImage.url")
      .sort({ createdAt: -1 }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        unreadCount: unreadNotifications.length,
        readCount: readNotifications.length,
        unreadNotifications,
        readNotifications,
      },
      "Notifications fetched by status"
    )
  );
});
