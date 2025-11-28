import multer from "multer";
import path from "path";

// Storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});

// File filter (optional but recommended)
function fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files allowed"), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
});

// ⭐ DEFAULT EXPORT here!
export default upload;
