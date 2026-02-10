import { Router } from "express";
import { auth, UserRole } from "../../middleware/auth";
import { slotController } from "./slot.controller";

export const slotRouter = Router();
slotRouter.post("/", auth(UserRole.TUTOR), slotController.createTimeSlot);
slotRouter.get(
  "/",
  auth(UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN),
  slotController.getAvailabilitySlotsByTutorId,
);
