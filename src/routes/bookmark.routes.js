import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleBoookmark,
  getUserBookmarks,
} from "../controllers/bookmark.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/user/:userId").get(getUserBookmarks);
router.route("/toggle/:blogId").post(toggleBoookmark);

export default router;
