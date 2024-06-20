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
    // console.log(response);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (fileToDelete) => {
  try {
    const response = await cloudinary.uploader.destroy(fileToDelete, {
      resource_type: "image",
    });
    return response;
  } catch (error) {
    return null;
  }
};

const deleteVideoFromCloudinary = async (fileToDelete) => {
  try {
    const response = await cloudinary.uploader.destroy(fileToDelete, {
      resource_type: "video",
    });
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteVideoFromCloudinary, deleteFromCloudinary };

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
