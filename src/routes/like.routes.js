import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getLikedBlog,
  toggleBlogLike,
  toggleCommentLike,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:blogId").post(toggleBlogLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/blogs").get(getLikedBlog);

export default router;
