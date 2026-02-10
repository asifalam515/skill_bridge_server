import { Router } from "express";
import { auth, UserRole } from "../../middleware/auth";
import { bookingController } from "./booking.controller";

export const bookingRouter = Router();
// student routes
bookingRouter.get(
  "/",
  auth(UserRole.STUDENT),
  bookingController.getStudentsBookings,
);
// CANCEL BOOKING by STUDENT
bookingRouter.put(
  "/:bookingId",
  auth(UserRole.STUDENT),
  bookingController.cancelBooking,
);
// booking completion by STUDENT
bookingRouter.put(
  "/complete/:bookingId",
  auth(UserRole.STUDENT),
  bookingController.bookingCompletion,
);
// tutor routes
// get tutor bookings
bookingRouter.get(
  "/tutor/:tutorId",
  auth(UserRole.TUTOR),
  bookingController.getTutorBookings,
);
bookingRouter.put(
  "/tutor/status/:bookingId",
  auth(UserRole.TUTOR),
  bookingController.updateBookingStatus,
);

bookingRouter.post("/", bookingController.createBooking);
