import { Request, Response } from "express";
import { BookingStatus } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { bookingRelatedService } from "./booking.service";
const createBooking = async (req: Request, res: Response) => {
  const { studentId, slotId } = req.body;
  try {
    const booking = await bookingRelatedService.createBooking(
      studentId,
      slotId,
    );
    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
const getStudentsBookings = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { status } = req.query;

    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    const bookings = await bookingRelatedService.getStudentBookings(
      studentId,
      status as BookingStatus,
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};
const getTutorBookings = async (req: Request, res: Response) => {
  try {
    const tutorId = req.params.tutorId;
    const { status } = req.query;

    // Verify the tutor owns this profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user?.id },
    });

    if (!tutorProfile || tutorProfile.id !== tutorId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const bookings = await bookingRelatedService.getTutorBookings(
      tutorId,
      status as BookingStatus,
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};
const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!status) return res.status(400).json({ error: "Status is required" });

    const booking = await bookingRelatedService.updateBookingStatus(
      bookingId,
      userId,
      status,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
const cancelBooking = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const studentId = req.user?.id;

    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    const booking = await bookingRelatedService.cancelBooking(
      bookingId,
      studentId,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
const bookingCompletion = async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const studentId = req.user?.id;

    if (!studentId) return res.status(401).json({ error: "Unauthorized" });

    const booking = await bookingRelatedService.bookingCompletion(
      bookingId,
      studentId,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const bookingController = {
  createBooking,
  getStudentsBookings,
  getTutorBookings,
  cancelBooking,
  updateBookingStatus,
  bookingCompletion,
};
