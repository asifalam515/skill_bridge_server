import { Request, Response } from "express";
import { reviewService } from "./review.service";

const createReview = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { bookingId, rating, comment } = req.body;

    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!bookingId || !rating) {
      return res
        .status(400)
        .json({ error: "Booking ID and rating are required" });
    }

    const review = await reviewService.createReview(req.body, studentId);

    res.status(201).json(review);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
const getTutorReview = async (req: Request, res: Response) => {
  try {
    const tutorId = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewService.getTutorReviews(tutorId, page, limit);
    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

export const reviewController = {
  createReview,
  getTutorReview,
};
