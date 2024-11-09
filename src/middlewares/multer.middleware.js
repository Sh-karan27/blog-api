// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Use '/tmp' directory for serverless environments
//     const tempDir = path.join("/tmp");
//     cb(null, tempDir);
//   },
//   filename: function (req, file, cb) {
//     // Generate a unique filename to avoid conflicts
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const fileExtension = path.extname(file.originalname);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
//   },
// });

// export const upload = multer({ storage });



import multer from "multer";

export const upload = multer({ storage: multer.memoryStorage() });
