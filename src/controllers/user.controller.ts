import { Request, Response } from "express";

import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const currentUserId = req.userId;

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter: Record<string, unknown> = {
      _id: {
        $ne: currentUserId,
      },
    };

    if (search) {
      filter.$or = [
        {
          username: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const users = await User.find(filter)
      .select("_id username email avatar status lastSeen")
      .sort({
        username: 1,
      })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
