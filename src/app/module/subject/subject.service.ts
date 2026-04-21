import { prisma } from "../../lib/prisma";
import { ISubject } from "./subject.interface";
import { deleteFromCloudinary, getPublicIdFromUrl, uploadToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelper/AppError";
import status from "http-status";

const createSubject = async (payload: ISubject) => {
  const result = await prisma.subject.create({
    data: payload,
  });
  return result;
};

const getAllSubjects = async () => {
  const result = await prisma.subject.findMany();
  return result;
};

const getSubjectById = async (id: string) => {
  const result = await prisma.subject.findUnique({
    where: { id },
  });
  return result;
};

const deleteSubject = async (id: string) => {
  const result = await prisma.subject.delete({
    where: { id },
  });
  return result;
};

const uploadIcon = async (id: string, fileBuffer: Buffer) => {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) throw new AppError(status.NOT_FOUND, "Subject not found.");

  // Delete old icon from Cloudinary if it exists
  if (subject.image) {
    const publicId = getPublicIdFromUrl(subject.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image").catch(() => null);
    }
  }

  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/subjects", {
    transformation: [{ width: 200, height: 200, crop: "pad", background: "auto" }],
    format: "webp",
  });

  return await prisma.subject.update({
    where: { id },
    data: { image: url },
  });
};

export const SubjectService = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  deleteSubject,
  uploadIcon,
};

