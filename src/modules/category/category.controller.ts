import { Request, Response } from "express";
import { categoryService } from "./category.service";

const createCategoryByAdmin = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const category = await categoryService.createCategoryByAdmin(
      req.body,
      req.user?.id as string,
    );
    res.status(201).json({
      success: true,
      data: category,
      message: "Category created successfully by admin",
    });
  } catch (error: any) {
    // Log the actual error for debugging
    console.error("Category creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create category by admin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const categoryController = {
  createCategoryByAdmin,
};
