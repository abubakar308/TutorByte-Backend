import multer from "multer";
import AppError from "../errorHelper/AppError";
import status from "http-status";

// ── Store files in memory (Buffer) so we stream directly to Cloudinary ──
// No temp files written to disk.

const storage = multer.memoryStorage();

const fileFilter = (
  allowedMimeTypes: string[]
): multer.Options["fileFilter"] =>
  (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          status.UNPROCESSABLE_ENTITY,
          `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(", ")}`
        )
      );
    }
  };

// ─────────────────────────────────────────────────────────────
//  UPLOAD CONFIGS
// ─────────────────────────────────────────────────────────────

/** Single avatar / profile picture — images only, max 5 MB */
export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(["image/jpeg", "image/png", "image/webp"]),
}).single("avatar");

/** Up to 5 certificate images, max 5 MB each */
export const uploadCertificates = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
}).array("certificates", 5);

/** Intro video — mp4/mov, max 100 MB */
export const uploadIntroVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter(["video/mp4", "video/quicktime", "video/webm"]),
}).single("introVideo");