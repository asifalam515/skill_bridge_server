import { TutorCategory } from "../../../generated/prisma/browser";
import { prisma } from "../../../lib/prisma";

const createCategory = async (categoryData: TutorCategory) => {
  const newCategory = await prisma.tutorCategory.create({
    data: categoryData,
  });
  return newCategory;
};

export const categoriesService = {
  createCategory,
};
