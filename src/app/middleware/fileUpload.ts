import multer from 'multer';
import { Request } from 'express';
import status from 'http-status';
import AppError from '../errorHelper/AppError';

/**
 * Common Multer configuration for memory storage
 */
const storage = multer.memoryStorage();

/**
 * Filter for images only
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError(status.BAD_REQUEST, 'Only image files are allowed!') as any, false);
  }
};

export const fileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
