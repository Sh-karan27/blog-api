import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
// app.use(
//   cors({
//     origin: "*",
//   })
// );

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) {
//       // Allow requests like Postman or server-to-server requests (no origin)
//       callback(null, true);
//     } else {
//       // Allow requests from any origin
//       callback(null, true);
//     }
//   },
//   credentials: true, // Allow cookies, tokens, etc.
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// Dynamic CORS setup to allow all origins WITH credentials
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman) or from any origin
    callback(null, origin || true);
  },
  credentials: true, // Allow cookies, authorization headers
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// app.use(cors(corsOptions));

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
