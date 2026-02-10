import { prisma } from "../../../lib/prisma";

export const updateTutorRating = async (tutorId: string) => {
  const reviews = await prisma.review.findMany({
    where: { tutorId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    // If no reviews, set rating to 0
    await prisma.tutorProfile.update({
      where: { id: tutorId },
      data: { rating: 0 },
    });
    return;
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Round to 1 decimal place
  const roundedRating = Math.round(averageRating * 10) / 10;

  await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: { rating: roundedRating },
  });
};
