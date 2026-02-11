import { TutorProfile } from "../../../generated/prisma/browser";
import { prisma } from "../../../lib/prisma";

const createTutorProfile = async (
  data: {
    bio: string;
    pricePerHr: number;
    experience: number;
    categoryIds?: string[];
  },
  userId: string,
) => {
  return await prisma.$transaction(async (tx) => {
    // Create tutor profile
    const tutorProfile = await tx.tutorProfile.create({
      data: {
        bio: data.bio,
        pricePerHr: data.pricePerHr,
        experience: data.experience,
        userId: userId,
      },
    });

    // Add categories if provided
    if (data.categoryIds && data.categoryIds.length > 0) {
      const tutorCategories = data.categoryIds.map((categoryId) => ({
        tutorId: tutorProfile.id,
        categoryId,
      }));

      await tx.tutorCategory.createMany({
        data: tutorCategories,
        skipDuplicates: true,
      });
    }

    return await tx.tutorProfile.findUnique({
      where: { id: tutorProfile.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  });
};
interface TutorFilters {
  search?: string;
  categoryIds?: string[];
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  isFeatured?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "rating" | "pricePerHr" | "experience" | "createdAt";
  sortOrder?: "asc" | "desc";
}

const getAllTutorProfiles = async (filters: TutorFilters) => {
  const {
    search,
    categoryIds,
    minRating = 0,
    maxPrice,
    minPrice = 0,
    isFeatured,
    isVerified,
    page = 1,
    limit = 10,
    sortBy = "rating",
    sortOrder = "desc",
  } = filters;

  const skip = (page - 1) * limit;

  // Build WHERE clause
  const where: any = {
    AND: [],
  };

  // Search in bio OR user name
  if (search) {
    where.AND.push({
      OR: [
        { bio: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  // Filter by categories
  if (categoryIds && categoryIds.length > 0) {
    where.AND.push({
      categories: {
        some: {
          categoryId: { in: categoryIds },
        },
      },
    });
  }

  // Filter by rating
  if (minRating > 0) {
    where.AND.push({
      rating: { gte: minRating },
    });
  }

  // Filter by price range
  const priceConditions: any[] = [];

  if (minPrice > 0) {
    priceConditions.push({ pricePerHr: { gte: minPrice } });
  }

  if (maxPrice) {
    priceConditions.push({ pricePerHr: { lte: maxPrice } });
  }

  if (priceConditions.length > 0) {
    where.AND.push({
      AND: priceConditions,
    });
  }

  // Filter by verification status
  if (isVerified !== undefined) {
    where.AND.push({ isVerified });
  }
  if (isFeatured !== undefined) {
    where.AND.push({ isFeatured });
  }

  // If no conditions, remove AND wrapper
  if (where.AND.length === 0) {
    delete where.AND;
  }

  // Get total count for pagination
  const total = await prisma.tutorProfile.count({ where });

  // Build ORDER BY
  const orderBy: any = {};
  if (
    sortBy === "pricePerHr" ||
    sortBy === "rating" ||
    sortBy === "experience" ||
    sortBy === "createdAt"
  ) {
    orderBy[sortBy] = sortOrder;
  } else {
    // Default sorting by rating descending
    orderBy.rating = "desc";
  }

  // Fetch tutors with pagination
  const tutorsProfile = await prisma.tutorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      reviews: {
        take: 3, // Get 3 most recent reviews
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      availability: {
        where: {
          isBooked: false,
          startTime: { gt: new Date() }, // Only future available slots
        },
        take: 5, // Show first 5 available slots
      },
      _count: {
        select: {
          reviews: true,
          bookings: {
            where: { status: "COMPLETED" },
          },
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  });

  // Format response
  const formattedTutors = tutorsProfile.map((tutor) => ({
    id: tutor.id,
    name: tutor.user.name,
    email: tutor.user.email,
    image: tutor.user.image,
    bio: tutor.bio,
    pricePerHr: tutor.pricePerHr,
    rating: tutor.rating,
    experience: tutor.experience,
    isVerified: tutor.isVerified,
    createdAt: tutor.createdAt,

    // Categories
    categories: tutor.categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
    })),

    // Recent reviews
    recentReviews: tutor.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      studentName: review.student.name,
      studentImage: review.student.image,
    })),

    // Statistics
    totalReviews: tutor._count.reviews,
    completedSessions: tutor._count.bookings,

    // Availability
    availableSlots: tutor.availability.length,
    nextAvailableSlot:
      tutor.availability.length > 0 ? tutor.availability[0]?.startTime : null,
  }));

  return {
    tutors: formattedTutors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    filters: {
      applied: {
        search,
        categories: categoryIds,
        minRating,
        minPrice,
        maxPrice,
        isVerified,
      },
      available: {
        // You could add available filter ranges here
        minRating: 0,
        maxRating: 5,
        minPrice: 0,
        maxPrice: await prisma.tutorProfile
          .aggregate({
            _max: { pricePerHr: true },
          })
          .then((result) => result._max.pricePerHr || 100),
      },
    },
  };
};
const getTutorProfileByUserId = async (userId: string) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: userId },
  });
  return tutorProfile;
};
const updateTutorProfileById = async (
  updatedData: Partial<TutorProfile>,
  tutorProfileId: string,
) => {
  const updatedTutorProfile = await prisma.tutorProfile.update({
    where: { id: tutorProfileId },
    data: updatedData,
  });
  return updatedTutorProfile;
};
const deleteTutorProfileById = async (tutorProfileId: string) => {
  await prisma.tutorProfile.delete({
    where: { id: tutorProfileId },
  });
};
export const tutorProfileService = {
  createTutorProfile,
  getAllTutorProfiles,
  getTutorProfileByUserId,
  updateTutorProfileById,
  deleteTutorProfileById,
};
