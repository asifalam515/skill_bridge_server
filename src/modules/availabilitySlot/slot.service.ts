import { prisma } from "../../../lib/prisma";

const createTimeSlotService = async (data: any, userId: string) => {
  const tutorId = await prisma.tutorProfile
    .findUnique({
      where: { userId: userId },
    })
    .then((profile) => {
      if (!profile) {
        throw new Error("Tutor profile not found for the user");
      }
      return profile.id;
    });
  const newSlot = await prisma.availabilitySlot.create({
    data: {
      ...data,

      tutorId: tutorId,
    },
  });
  return newSlot;
};
const getAvailabilitySlotsByTutorId = async (userId: string) => {
  const tutorId = await prisma.tutorProfile
    .findUnique({
      where: { userId: userId },
    })
    .then((profile) => {
      if (!profile) {
        throw new Error("Tutor profile not found for the user");
      }
      return profile.id;
    });
  const slots = await prisma.availabilitySlot.findMany({
    where: { tutorId: tutorId },
  });
  return slots;
};
const deleteAvailabilitySlotById = async (slotId: string, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Find the tutor profile for the given user
    const tutorProfile = await tx.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      throw new Error("Tutor profile not found for the user");
    }

    // 2. Find the slot and verify it belongs to this tutor
    const slot = await tx.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.tutorId !== tutorProfile.id) {
      throw new Error("Not authorized to delete this slot");
    }

    // 3. Optionally: prevent deletion if slot is booked
    if (slot.isBooked) {
      throw new Error("Cannot delete a booked slot");
    }

    // 4. Delete the slot
    const deletedSlot = await tx.availabilitySlot.delete({
      where: { id: slotId },
    });

    return deletedSlot;
  });
};
export const slotService = {
  createTimeSlotService,
  getAvailabilitySlotsByTutorId,
  deleteAvailabilitySlotById,
};
