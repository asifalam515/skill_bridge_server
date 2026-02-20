import { Router } from "express";
import { auth, UserRole } from "../../middleware/auth";
import { slotController } from "./slot.controller";

export const slotRouter = Router();
slotRouter.post("/", auth(UserRole.TUTOR), slotController.createTimeSlot);
// get all availability slots for a tutor, this will be used by students to see which slots are available for booking
slotRouter.get(
  "/tutor/:tutorId",
  auth(UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN),
  slotController.getAvailabilitySlots,
);
// get availability slots for a tutor
slotRouter.get(
  "/",
  auth(UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN),
  slotController.getAvailabilitySlotsByTutorId,
);

slotRouter.delete(
  "/:slotId",
  auth(UserRole.TUTOR, UserRole.ADMIN),
  slotController.deleteAvailabilitySlot,
);
