import { Request, Response } from "express";
import { prisma } from "../../../lib/prisma";
import { adminService } from "./admin.service";

export const adminController = {
  // 1. Get all users
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const { role, status, search, page = 1, limit = 20 } = req.query;

      const result = await adminService.getAllUsers({
        role: role as any,
        status: status as any,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },

  // 2. Get user details
  getUserDetails: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const user = await adminService.getUserDetails(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  },

  // 3. Update user status (ban/unban)
  updateUserStatus: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const { status, banned, banReason, banExpires } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const updatedUser = await adminService.updateUserStatus(userId, {
        status,
        banned,
        banReason,
        banExpires: banExpires ? new Date(banExpires) : undefined,
      });

      res.json({
        message: "User status updated successfully",
        user: updatedUser,
      });
    } catch (error: any) {
      console.error("Error updating user status:", error);
      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update user status" });
    }
  },

  // 4. Get all bookings
  getAllBookings: async (req: Request, res: Response) => {
    try {
      const {
        status,
        tutorId,
        studentId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const result = await adminService.getAllBookings({
        status: status as string,
        tutorId: tutorId as string,
        studentId: studentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  },

  // 5. Update booking status
  updateBookingStatus: async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.bookingId as string;
      const { status } = req.body;

      if (!bookingId || !status) {
        return res
          .status(400)
          .json({ error: "Booking ID and status are required" });
      }

      const updatedBooking = await adminService.updateBookingStatus(
        bookingId,
        status,
      );

      res.json({
        message: "Booking status updated successfully",
        booking: updatedBooking,
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ error: "Failed to update booking status" });
    }
  },

  // 6. Get dashboard statistics
  getDashboardStats: async (req: Request, res: Response) => {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  },

  // 7. Delete user (soft delete or hard delete)
  deleteUser: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const { hardDelete = true } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (hardDelete) {
        // Hard delete - remove from database
        await prisma.user.delete({
          where: { id: userId },
        });
        return res.json({ message: "User permanently deleted" });
      } else {
        // Soft delete - mark as deactivated
        await prisma.user.update({
          where: { id: userId },
          data: {
            status: "BANNED",
            banned: true,
          },
        });
        return res.json({ message: "User banned successfully" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },

  // 8. Verify/Unverify tutor
  verifyTutor: async (req: Request, res: Response) => {
    try {
      const tutorId = req.params.tutorId as string;
      const { isVerified } = req.body;

      if (isVerified === undefined) {
        return res
          .status(400)
          .json({ error: "Verification status is required" });
      }

      const tutor = await prisma.tutorProfile.update({
        where: { id: tutorId },
        data: { isVerified },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({
        message: `Tutor ${isVerified ? "verified" : "unverified"} successfully`,
        tutor,
      });
    } catch (error) {
      console.error("Error verifying tutor:", error);
      res.status(500).json({ error: "Failed to update tutor verification" });
    }
  },
};
