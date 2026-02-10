import { Router } from "express";
import { auth, UserRole } from "../../middleware/auth";
import { adminController } from "./admin.controller";

export const adminRouter = Router();
adminRouter.get(
  "/dashboard",
  auth(UserRole.ADMIN),
  adminController.getDashboardStats,
);
// User management
adminRouter.get("/users", auth(UserRole.ADMIN), adminController.getAllUsers);
adminRouter.get(
  "/users/:userId",
  auth(UserRole.ADMIN),
  adminController.getUserDetails,
);
adminRouter.put(
  "/users/:userId/status",
  auth(UserRole.ADMIN),
  adminController.updateUserStatus,
);
adminRouter.delete(
  "/users/:userId",
  auth(UserRole.ADMIN),
  adminController.deleteUser,
);
adminRouter.put(
  "/tutors/:tutorId/verify",
  auth(UserRole.ADMIN),
  adminController.verifyTutor,
);
// Booking management
adminRouter.get(
  "/bookings",
  auth(UserRole.ADMIN),
  adminController.getAllBookings,
);
adminRouter.put(
  "/bookings/:bookingId/status",
  auth(UserRole.ADMIN),
  adminController.updateBookingStatus,
);
