import { Review } from "../../../generated/prisma/browser";
import { prisma } from "../../../lib/prisma";

const createReview = async (data: Review, studentId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if booking exists and belongs to the student
    const booking = await tx.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        student: true,
        tutor: true,
        review: true, // Check if review already exists
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // 2. Verify student owns this booking
    if (booking.studentId !== studentId) {
      throw new Error("Not authorized to review this booking");
    }

    // 3. Check if review already exists for this booking
    if (booking.review) {
      throw new Error("Review already exists for this booking");
    }

    // 4. Check if booking is completed (only completed bookings can be reviewed)
    if (booking.status !== "COMPLETED") {
      throw new Error("Only completed bookings can be reviewed");
    }

    // 5. Validate rating (1-5)
    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // 6. Create the review
    const review = await tx.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        studentId: booking.studentId,
        tutorId: booking.tutorId,
        bookingId: booking.id,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        booking: true,
      },
    });
    const reviews = await tx.review.findMany({
      where: { tutorId: booking.tutorId },
      select: { rating: true },
    });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await tx.tutorProfile.update({
      where: { id: booking.tutorId },
      data: { rating: Number(avgRating.toFixed(1)) },
    });

    // await updateTutorRating(booking.tutorId);

    return review;
  });
};
const getReviewByBooking = (bookingId: string) => {
  return prisma.review.findUnique({
    where: { bookingId },
  });
};
const getTutorReviews = async (
  tutorId: string,
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { tutorId },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        booking: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { tutorId } }),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
const getStudentReviews = async (studentId: string) => {
  return await prisma.review.findMany({
    where: { studentId },
    include: {
      tutor: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      booking: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const reviewService = {
  createReview,
  getReviewByBooking,
  getTutorReviews,
  getStudentReviews,
};
