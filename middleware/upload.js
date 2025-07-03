const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.substring(file.originalname.lastIndexOf("."));
        cb(null, `${Date.now()}${ext}`);
    },
});

const fileFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const limits = {
    fileSize: 1024 * 1024 * 100, // 100MB
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: limits,
}).array("productImages", 5);

module.exports = upload;