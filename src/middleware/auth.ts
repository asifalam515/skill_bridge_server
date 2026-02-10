// import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../../lib/auth";

import { NextFunction, Request, Response } from "express";
export enum UserRole {
  ADMIN = "ADMIN",
  TUTOR = "TUTOR",
  STUDENT = "STUDENT",
}
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "STUDENT" | "TUTOR" | "ADMIN";
        status: "ACTIVE" | "BANNED";
      };
    }
  }
}

export const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      //get user session
      const session = await betterAuth.api.getSession({
        headers: req.headers as any,
      });
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role as UserRole,
        status: session.user.status as "ACTIVE" | "BANNED",
      };
      if (roles.length && !roles.includes(req.user.role as UserRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You do not have access to this resource.",
        });
      }
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
};
