import { Router } from "express";
import { auth, UserRole } from "../../middleware/auth";
import { tutorProfileController } from "./tutorProfile.controller";

export const tutorProfileRouter = Router();
tutorProfileRouter.post(
  "/",
  auth(UserRole.TUTOR),
  tutorProfileController.createTutorProfile,
);
tutorProfileRouter.get("/", tutorProfileController.getAllTutorProfiles);
tutorProfileRouter.get(
  "/:userId",
  tutorProfileController.getTutorProfileByUserId,
);
tutorProfileRouter.put(
  "/:id",
  auth(UserRole.TUTOR),
  tutorProfileController.updateTutorProfileById,
);
tutorProfileRouter.delete(
  "/:id",
  auth(UserRole.TUTOR, UserRole.ADMIN),
  tutorProfileController.deleteTutorProfileById,
);
