import { NextFunction, Request, Response } from "express";

type Role = "STUDENT" | "TUTOR" | "ADMIN";

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (user.status === "BANNED") {
      return res.status(403).json({ message: "Account is banned" });
    }

    next();
  };
