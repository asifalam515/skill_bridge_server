import express from "express";
import { analyticsController } from "./analytics.controller";

export const analyticsRouter = express.Router();

analyticsRouter.get("/", analyticsController.getGlobalStats);
