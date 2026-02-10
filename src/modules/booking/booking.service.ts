import { BookingStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";

export const bookingService = {
  async getAvailableSlots(tutorId: string, date: Date) {
    // Logic to get available slots for a tutor on a specific date
    return prisma.availabilitySlot.findMany({
      where: {
        tutorId,

        isBooked: false,
        startTime: date
          ? {
              gte: new Date(date.setHours(0, 0, 0, 0)),
              lt: new Date(date.setHours(23, 59, 59, 999)),
            }
          : { gte: new Date() }, // Future slots only
      },
      orderBy: { startTime: "asc" },
    });
  },
};
// Create a booking
const createBooking = async (studentId: string, slotId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if slot exists and is available
    const slot = await tx.availabilitySlot.findUnique({
      where: { id: slotId, isBooked: false },
      include: { tutor: true },
    });

    if (!slot) {
      throw new Error("Time slot not found or already booked");
    }

    // 2. Check if slot is in the future
    if (slot.startTime > new Date()) {
      throw new Error("Cannot book past time slots");
    }

    // 3. Check if student is trying to book themselves (student != tutor)
    const tutorUser = await tx.user.findUnique({
      where: { id: slot.tutor.userId },
    });

    if (tutorUser?.id === studentId) {
      throw new Error("Cannot book your own tutoring session");
    }

    // 4. Check if student already has overlapping booking
    const existingBooking = await tx.booking.findFirst({
      where: {
        studentId,
        status: { in: ["PENDING", "CONFIRMED"] },
        slot: {
          startTime: { lt: slot.endTime },
          endTime: { gt: slot.startTime },
        },
      },
    });

    if (existingBooking) {
      throw new Error("You already have a booking during this time");
    }

    // 5. Create the booking
    const booking = await tx.booking.create({
      data: {
        studentId,
        tutorId: slot.tutorId,
        slotId: slot.id,
        date: slot.startTime,
        status: "PENDING",
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        tutor: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        slot: true,
      },
    });

    // 6. Mark slot as booked
    await tx.availabilitySlot.update({
      where: { id: slotId },
      data: { isBooked: true },
    });

    return booking;
  });
};
const getStudentBookings = async (
  studentId: string,
  status?: BookingStatus,
) => {
  return await prisma.booking.findMany({
    where: {
      studentId,
      ...(status && { status }),
    },
    include: {
      tutor: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      slot: true,
    },
    orderBy: { date: "asc" },
  });
};
const getTutorBookings = async (tutorId: string, status?: BookingStatus) => {
  return await prisma.booking.findMany({
    where: {
      tutorId,
      ...(status && { status }),
    },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      slot: true,
    },
    orderBy: { date: "asc" },
  });
};
const updateBookingStatus = async (
  bookingId: string,
  userId: string,
  status: BookingStatus,
) => {
  return await prisma.$transaction(async (tx) => {
    const tutorId = await tx.tutorProfile
      .findUnique({
        where: { userId },
      })
      .then((profile) => profile?.id);

    if (!tutorId) throw new Error("Tutor profile not found");
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");
    if (booking.tutorId !== tutorId) throw new Error("Not authorized");

    // If rejecting or cancelling, free up the slot
    if (status === "CANCELLED") {
      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false },
      });
    }

    return await tx.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        student: {
          select: { name: true, email: true },
        },
        slot: true,
      },
    });
  });
};
const cancelBooking = async (bookingId: string, studentId: string) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");
    if (booking.studentId !== studentId) throw new Error("Not authorized");

    // Free up the slot
    await tx.availabilitySlot.update({
      where: { id: booking.slotId },
      data: { isBooked: false },
    });

    return await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });
  });
};
const bookingCompletion = async (bookingId: string, studentId: string) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");
    if (booking.studentId !== studentId) throw new Error("Not authorized");
    if (booking.status !== "CONFIRMED")
      throw new Error("Only confirmed bookings can be completed");

    return await tx.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
    });
  });
};

export const bookingRelatedService = {
  createBooking,
  getStudentBookings,
  getTutorBookings,
  updateBookingStatus,
  cancelBooking,
  bookingCompletion,
};
