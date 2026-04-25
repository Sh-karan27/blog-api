import express from "express";
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  getNotificationsByUserId,
  getNotificationsByStatus,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").post(createNotification);
router.route("/").get(getUserNotifications);
router.route("/user/:userId").get(getNotificationsByUserId);
router.route("/unread-count").get(getUnreadNotificationCount);
router.route("/:id/read").patch(markNotificationAsRead);
router.route("/user/:userId/status").get(getNotificationsByStatus);

export default router;
