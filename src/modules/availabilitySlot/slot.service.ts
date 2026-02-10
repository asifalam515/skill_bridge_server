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
export const slotService = {
  createTimeSlotService,
  getAvailabilitySlotsByTutorId,
};
