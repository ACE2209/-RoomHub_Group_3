import multer from "multer";
import path from "path";

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = "public/images";
    if (file.fieldname === "avatar") {
      cb(null, `${path}/avatars`);
    } else if (file.fieldname === "product_image") {
      cb(null, `${path}/products`);
    } else if (file.fieldname === "product_variant_img") {
      cb(null, `${path}/productVariants`);
    } else if (file.fieldname === "commentImage") {
      cb(null, `${path}/comments`);
    }
  },
  filename: function (req, file, cb) {
    const extension =
      path.extname(file.originalname) || getFileExtension(file.mimetype);
    cb(null, `${file.fieldname}-${Date.now()}${extension}`);
  },
});

const getFileExtension = (mimetype) => {
  switch (mimetype) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
};

export const upload = multer({ storage: storage });
