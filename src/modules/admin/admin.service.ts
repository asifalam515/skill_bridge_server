import { Role, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";
import { BookingStatus } from "./../../../generated/prisma/enums";

export const adminService = {
  // 1. Get all users with filtering
  async getAllUsers(filters: {
    role?: Role;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, status, search, page = 1, limit = 20 } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          banned: true,
          banReason: true,
          banExpires: true,
          createdAt: true,
          tutorProfile: {
            select: {
              id: true,
              rating: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // 2. Get user by ID with detailed info
  async getUserDetails(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,

        // Student info
        bookings: {
          include: {
            tutor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            slot: true,
            review: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },

        // Tutor info
        tutorProfile: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            bookings: {
              include: {
                student: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            reviews: {
              include: {
                student: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            availability: {
              orderBy: { startTime: "desc" },
              take: 10,
            },
          },
        },

        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });
  },

  // 3. Update user status (ban/unban)
  async updateUserStatus(
    userId: string,
    data: {
      status?: UserStatus;
      banned?: boolean;
      banReason?: string;
      banExpires?: Date;
    },
  ) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // If banning, also set status to SUSPENDED
      const updateData: any = { ...data };
      if (data.banned === true) {
        updateData.status = UserStatus.BANNED;
      } else if (data.banned === false) {
        updateData.status = UserStatus.ACTIVE;
        updateData.banReason = null;
        updateData.banExpires = null;
      }

      return await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          banned: true,
          banReason: true,
          banExpires: true,
        },
      });
    });
  },

  // 4. Get all bookings with filters
  async getAllBookings(filters: {
    status?: string;
    tutorId?: string;
    studentId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      tutorId,
      studentId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (tutorId) {
      where.tutorId = tutorId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (search) {
      where.OR = [
        {
          student: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          student: {
            email: { contains: search, mode: "insensitive" },
          },
        },
        {
          tutor: {
            user: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          tutor: {
            user: {
              email: { contains: search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tutor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          slot: true,
          review: true,
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Calculate booking statistics
    const stats = await prisma.booking.aggregate({
      where,
      _count: { id: true },
    });

    return {
      bookings,
      stats: {
        total: stats._count.id,
        // Add other stats as needed
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // 5. Update booking status (admin can override)
  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  },

  // 6. Get dashboard statistics
  async getDashboardStats() {
    const [
      totalUsers,
      totalTutors,
      totalStudents,
      totalBookings,
      totalRevenue,
      recentUsers,
      recentBookings,
      categoryStats,
      userGrowth,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.booking.count(),

      // Total revenue (assuming you have pricing)
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
      }),

      // Recent users (last 7 days)
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),

      // Recent bookings
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          student: {
            select: { name: true },
          },
          tutor: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      }),

      // Category statistics
      prisma.category.findMany({
        include: {
          _count: {
            select: { tutors: true },
          },
        },
        orderBy: {
          tutors: {
            _count: "desc",
          },
        },
        take: 5,
      }),

      (async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyStats = await prisma.$queryRaw`
          SELECT 
            DATE("createdAt") as date,
            COUNT(*) as count,
            SUM(CASE WHEN role = 'TUTOR' THEN 1 ELSE 0 END) as tutors,
            SUM(CASE WHEN role = 'STUDENT' THEN 1 ELSE 0 END) as students
          FROM "User"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `;

        return dailyStats;
      })(),
    ]);

    return {
      overview: {
        totalUsers,
        totalTutors,
        totalStudents,
        totalBookings,
      },
      recentUsers,
      recentBookings,
      categoryStats,
      userGrowth,
    };
  },
};
