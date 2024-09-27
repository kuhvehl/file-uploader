const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Extract the original name and its extension
    const originalName = path.basename(
      file.originalname,
      path.extname(file.originalname)
    ); // Get the original file name without the extension
    const fileExtension = path.extname(file.originalname); // Get the file extension

    // Create a new filename with the original name and timestamp
    const newFilename = `${originalName}-${Date.now()}${fileExtension}`;

    cb(null, newFilename); // Call the callback with the new filename
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
