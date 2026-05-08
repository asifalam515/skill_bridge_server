import { Request, Response } from "express";
import { analyticsService } from "./analytics.service";

export const analyticsController = {
  async getGlobalStats(req: Request, res: Response) {
    try {
      const stats = await analyticsService.getGlobalStats();
      return res.json({ analytics: stats });
    } catch (err: any) {
      console.error("analytics.getGlobalStats error:", err);
      return res
        .status(500)
        .json({ message: err?.message ?? "Internal error" });
    }
  },
};
