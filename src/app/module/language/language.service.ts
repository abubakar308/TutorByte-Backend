import { prisma } from "../../lib/prisma";
import { ILanguage } from "./language.interface";
import { deleteFromCloudinary, getPublicIdFromUrl, uploadToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelper/AppError";
import status from "http-status";

const createLanguage = async (payload: ILanguage) => {
  const result = await prisma.language.create({
    data: payload,
  });
  return result;
};

const getAllLanguages = async () => {
  const result = await prisma.language.findMany();
  return result;
};

const getLanguageById = async (id: string) => {
  const result = await prisma.language.findUnique({
    where: { id },
  });
  return result;
};

const updateLanguage = async (id: string, payload: Partial<ILanguage>) => {
  const result = await prisma.language.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteLanguage = async (id: string) => {
  const result = await prisma.language.delete({
    where: { id },
  });
  return result;
};

const uploadIcon = async (id: string, fileBuffer: Buffer) => {
  const language = await prisma.language.findUnique({ where: { id } });
  if (!language) throw new AppError(status.NOT_FOUND, "Language not found.");

  // Delete old icon from Cloudinary if it exists
  if (language.image) {
    const publicId = getPublicIdFromUrl(language.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image").catch(() => null);
    }
  }

  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/languages", {
    transformation: [{ width: 100, height: 100, crop: "pad", background: "auto" }],
    format: "webp",
  });

  return await prisma.language.update({
    where: { id },
    data: { image: url },
  });
};

export const LanguageService = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
  uploadIcon,
};

