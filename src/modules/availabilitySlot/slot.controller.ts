import { Request, Response } from "express";
import { slotService } from "./slot.service";
const createTimeSlot = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;

    const newSlot = await slotService.createTimeSlotService(req.body, userId);
    res.status(201).json(newSlot);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create time slot" });
  }
};
const getAvailabilitySlotsByTutorId = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;

    const slots = await slotService.getAvailabilitySlotsByTutorId(userId);
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve availability slots" });
  }
};
export const slotController = {
  createTimeSlot,
  getAvailabilitySlotsByTutorId,
};
