import { BookingStatus, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";

export const analyticsService = {
  async getGlobalStats() {
    // Active tutors: tutor profiles whose linked user is active
    const activeTutors = await prisma.tutorProfile.count({
      where: { user: { status: UserStatus.ACTIVE } },
    });

    // Sessions booked: count bookings that are not cancelled
    const sessionsBooked = await prisma.booking.count({
      where: { status: { not: BookingStatus.CANCELLED } },
    });

    // Average rating across reviews
    const avgAgg = await prisma.review.aggregate({ _avg: { rating: true } });
    const avgRating = Number((avgAgg._avg.rating ?? 0).toFixed(1));

    const totalReviews = await prisma.review.count();

    return {
      activeTutors,
      sessionsBooked,
      avgRating,
      totalReviews,
    };
  },
};
