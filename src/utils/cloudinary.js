import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARYY_CLOUD_NAME,
  api_key: process.env.CLOUDINARYY_API_KEY,
  api_secret: process.env.CLOUDINARYY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    //file has been uploaded
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

function extractPublicIdFromUrl(url) {
  const urlSegments = url.split("/");
  const fileName = urlSegments[urlSegments.length - 1];
  const publicId = fileName.split(".")[0];
  return publicId;
}

const deletFromCloudinary = async (url) => {
  try {
    if (!url) return null;
    const publicId = extractPublicIdFromUrl(url);
    const response = cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });
    return response;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

export { uploadOnCloudinary, deletFromCloudinary };

// const uploadOnCloudinary = await cloudinary.uploader
//   .upload(
//     "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//     {
//       public_id: "shoes",
//     }
//   )
//   .catch((error) => {
//     console.log(error);
//   });

// console.log(uploadResult);
