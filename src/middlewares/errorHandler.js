import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      data: err.data,
      message: err.message,
      success: false,
      errors: err.errors,
    });
  }

  // Fallback for any other errors
  return res.status(500).json({
    statusCode: 500,
    message: "Internal Server Error",
    success: false,
    errors: [],
  });
};

export { errorHandler };
