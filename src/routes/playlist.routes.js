import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addBlogToPlaylist,
  removeBlogFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router.route("/add/:playlistId/:blogId").patch(addBlogToPlaylist);
router.route("/remove/:blogId/").patch(removeBlogFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router;
