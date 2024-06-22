import { Router } from "express";
import {
  addComment,
  deleteComment,
  updateComment,
  getBlogComments,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

app.use(verifyJWT);

router.route("/:blogId").get(getBlogComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
