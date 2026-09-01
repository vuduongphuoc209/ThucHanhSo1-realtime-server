import { Response } from "express";

import Conversation from "../models/Conversation";
import User from "../models/User";

import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate("participants", "_id username email avatar status lastSeen")
      .populate("lastMessage")
      .sort({
        updatedAt: -1,
      });

    res.status(200).json({
      success: true,
      data: {
        conversations,
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createPrivateConversation = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "userId is required",
      });

      return;
    }

    if (userId === req.userId) {
      res.status(400).json({
        success: false,
        message: "You cannot chat with yourself",
      });

      return;
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    const existingConversation = await Conversation.findOne({
      type: "private",
      participants: {
        $all: [req.userId, userId],
        $size: 2,
      },
    })
      .populate("participants", "_id username email avatar status lastSeen")
      .populate("lastMessage");

    if (existingConversation) {
      res.status(200).json({
        success: true,
        data: {
          conversation: existingConversation,
        },
      });

      return;
    }

    const conversation = await Conversation.create({
      type: "private",
      participants: [req.userId, userId],
    });

    const populatedConversation = await Conversation.findById(
      conversation._id,
    ).populate("participants", "_id username email avatar status lastSeen");

    res.status(201).json({
      success: true,
      data: {
        conversation: populatedConversation,
      },
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
