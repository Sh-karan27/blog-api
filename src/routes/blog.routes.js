import { Router } from "express";
import {
  getAllBlogs,
  publishBlog,
  getBlogById,
  updateBlog,
  deleteBlog,
  getUserBlogs,
  toggleStatus,
} from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT); // Applyy verifyJWT to all routes in this file

router
  .route("/")
  .get(getAllBlogs)
  .post(upload.single("coverImage"), publishBlog);

router
  .route("/:blogId")
  .get(getBlogById)
  .delete(deleteBlog)
  .patch(upload.single("coverImage"), updateBlog);

router.route("/toggle/status/:blogId").patch(toggleStatus);

router.route("/u/:userId").get(getUserBlogs);

export default router;
