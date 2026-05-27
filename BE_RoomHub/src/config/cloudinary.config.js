import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getFileExtension = (mimetype) => {
  switch (mimetype) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    default:
      return "png";
  }
};

// Cấu hình Cloudinary Storage cho Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  allowedFormats: ["jpg", "png", "gif"],
  params: async (req, file) => {
    let folderName = "uploads";

    if (file.fieldname === "avatar") {
      folderName = "Avatar";
    } else if (file.fieldname === "boardingHouse") {
      folderName = "BoardingHouse";
    } else if (file.fieldname === "review") {
      folderName = "Review";
    } else if (file.fieldname === "report") {
      folderName = "Report";
    } else if (file.fieldname === "room") {
      folderName = "Room";
    } else if (file.fieldname === "roomType") {
      folderName = "RoomType";
    }

    return {
      folder: folderName,
      format: getFileExtension(file.mimetype),
    };
  },
});

export const upload = multer({ storage });
