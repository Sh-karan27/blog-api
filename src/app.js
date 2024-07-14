import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

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

app.use("/api/v1/users", userRouter);
app.use("/api/v1/follow", subscriptionRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/likes", likegRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/playlist", playlistRoutes);
app.use("/api/v1/bookmark", bookmarkRoutes);

export { app };
