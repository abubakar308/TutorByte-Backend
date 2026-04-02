import { prisma } from "../../lib/prisma";
import { ISubject } from "./subject.interface";

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
    where: {
      id,
    },
  });
  return result;
};

const deleteSubject = async (id: string) => {
  const result = await prisma.subject.delete({
    where: {
      id,
    },
  });
  return result;
};

export const SubjectService = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  deleteSubject,
};
