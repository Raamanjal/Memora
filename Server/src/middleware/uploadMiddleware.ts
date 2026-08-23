import multer from "multer";

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        // Only accept PDFs
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed!"));
        }
    },
});

