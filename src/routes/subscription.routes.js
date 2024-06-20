import { Router } from "express";
import {
  toggleFollower,
  getUserProfileFollower,
  getUserProfileFollowing,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

router.route("/p/:profileId").post(toggleFollower).get(getUserProfileFollowing);
router.route("/u/:profileId").get(getUserProfileFollower);

export default router;
