import { Response } from "express";

import Message from "../models/Message";
import Conversation from "../models/Conversation";

import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const getMessages = async (
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

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found",
      });

      return;
    }

    const messages = await Message.find({
      conversationId,
    })
      .populate("senderId", "_id username email avatar")
      .sort({
        createdAt: 1,
      });

    res.status(200).json({
      success: true,
      data: {
        messages,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createMessage = async (
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

    const { conversationId } = req.params;

    const { content, type = "text" } = req.body;

    if (!content?.trim()) {
      res.status(400).json({
        success: false,
        message: "Message content is required",
      });

      return;
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.userId,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: "Conversation not found",
      });

      return;
    }

    const message = await Message.create({
      conversationId,
      senderId: req.userId,
      content: content.trim(),
      type,
    });

    conversation.lastMessage = message._id;

    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "senderId",
      "_id username email avatar",
    );

    res.status(201).json({
      success: true,
      data: {
        message: populatedMessage,
      },
    });
  } catch (error) {
    console.error("Create message error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
