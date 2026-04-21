import { v2 as cloudinary } from "cloudinary";
import { envVars } from "../config/env";

cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
});


export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", ...options },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete a Cloudinary asset by public_id
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Extract public_id from a Cloudinary secure_url
 * "https://res.cloudinary.com/.../tutorbyte/avatars/abc123.jpg"
 * → "tutorbyte/avatars/abc123"
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null; // Not a standard Cloudinary URL
    
    const startIndex =
      uploadIndex + 1 + (parts[uploadIndex + 1]?.startsWith("v") ? 1 : 0);
    return parts.slice(startIndex).join("/").replace(/\.[^/.]+$/, "");
  } catch (error) {
    return null;
  }
};


export { cloudinary };