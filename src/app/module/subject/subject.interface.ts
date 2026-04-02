import { SubjectCategory } from "../../../generated/prisma/enums";

export type ISubject = {
  id?: string;
  name: string;
  category: SubjectCategory;
};
