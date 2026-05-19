const multer = require("multer");
const path = require("path");

const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/avatars/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/products/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/pjpeg"];
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (
    allowedTypes.includes(mimetype) ||
    extname === ".jpeg" ||
    extname === ".jpg" ||
    extname === ".png"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpeg, .jpg, .png files are allowed"), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

const uploadProductImages = multer({
  storage: productStorage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

module.exports = { uploadAvatar, uploadProductImages };
