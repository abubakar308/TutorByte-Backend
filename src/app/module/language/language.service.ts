import { prisma } from "../../lib/prisma";
import { ILanguage } from "./language.interface";

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
    where: {
      id,
    },
  });
  return result;
};

const updateLanguage = async (id: string, payload: Partial<ILanguage>) => {
  const result = await prisma.language.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};

const deleteLanguage = async (id: string) => {
  const result = await prisma.language.delete({
    where: {
      id,
    },
  });
  return result;
};

export const LanguageService = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
};
