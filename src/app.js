import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
app.use(cors());

app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRouter from "./routes/user.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import likegRoutes from "./routes/like.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";
//routes declaration
app.get("/", (req, res) => {
  res.send("server ready");
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/follow", subscriptionRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/likes", likegRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/playlist", playlistRoutes);
app.use("/api/v1/bookmark", bookmarkRoutes);

app.use(errorHandler);

export { app };
