import { Server } from "socket.io";
import mongoose from "mongoose";

import Conversation from "../../models/Conversation";
import Message from "../../models/Message";

import { AuthenticatedSocket } from "../socketAuth";

interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: "text" | "image" | "file";
  clientMessageId: string;
}

export const registerChatEvents = (io: Server, socket: AuthenticatedSocket) => {
  /**
   * JOIN CONVERSATION
   */
  socket.on("join_conversation", async (conversationId: string) => {
    try {
      if (!socket.userId) {
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        socket.emit("chat_error", {
          message: "Invalid conversation ID",
        });

        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId,
      });

      if (!conversation) {
        socket.emit("chat_error", {
          message: "You are not a member of this conversation",
        });

        return;
      }

      await socket.join(`conversation:${conversationId}`);

      socket.emit("joined_conversation", {
        conversationId,
      });
    } catch (error) {
      console.error("join_conversation error:", error);
    }
  });

  /**
   * LEAVE CONVERSATION
   */
  socket.on("leave_conversation", async (conversationId: string) => {
    await socket.leave(`conversation:${conversationId}`);
  });

  /**
   * SEND MESSAGE
   */
  socket.on("send_message", async (payload, callback: (response: any) => void) => {
    try {
      if (!socket.userId) {
        socket.emit("chat_error", {
          message: "Unauthorized",
        });

        return;
      }

      const { conversationId, content, type = "text", clientMessageId } = payload;

      if (!conversationId || !content?.trim() || !clientMessageId) {
        socket.emit("chat_error", {
          message: "conversationId, content, and clientMessageId are required",
        });

        return;
      }

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        socket.emit("chat_error", {
          message: "Invalid conversation ID",
        });

        return;
      }

      /**
       * Check user belongs to conversation
       */
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId,
      });

      if (!conversation) {
        socket.emit("chat_error", {
          message: "You are not a member of this conversation",
        });

        return;
      }

      /**
       * Check for duplicate message
       */
      const existing = await Message.findOne({
        clientMessageId,
      });

      if (existing) {
        const populatedExisting = await Message.findById(existing._id).populate(
          "senderId",
          "_id username email avatar",
        );

        callback?.({
          success: true,
          message: populatedExisting,
        });

        return;
      }

      /**
       * Save message
       */
      const message = await Message.create({
        conversationId,
        senderId: socket.userId,
        content: content.trim(),
        type,
        clientMessageId,
      });

      /**
       * Update last message
       */
      conversation.lastMessage = message._id;

      await conversation.save();

      /**
       * Populate sender
       */
      const populatedMessage = await Message.findById(message._id).populate("senderId", "_id username email avatar");

      /**
       * Broadcast to everyone
       * inside conversation room
       */
      io.to(`conversation:${conversationId}`).emit("new_message", {
        message: populatedMessage,
      });

      callback?.({
        success: true,
        message: populatedMessage,
      });
    } catch (error) {
      console.error("send_message error:", error);

      socket.emit("chat_error", {
        message: "Failed to send message",
      });

      callback?.({
        success: false,
        message: "Failed to send message",
      });
    }
  });
  /**
   * TYPING START
   */
  socket.on("typing_start", async (conversationId: string) => {
    try {
      if (!socket.userId) {
        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId,
      });

      if (!conversation) {
        return;
      }

      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId: socket.userId,
        conversationId,
      });
    } catch (error) {
      console.error("typing_start error:", error);
    }
  });
  /**
   * TYPING STOP
   */
  socket.on("typing_stop", async (conversationId: string) => {
    try {
      if (!socket.userId) {
        return;
      }

      socket.to(`conversation:${conversationId}`).emit("user_stopped_typing", {
        userId: socket.userId,
        conversationId,
      });
    } catch (error) {
      console.error("typing_stop error:", error);
    }
  });
  /**
   * MESSAGE READ
   */
  socket.on("message_read", async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
    try {
      if (!socket.userId) {
        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId,
      });

      if (!conversation) {
        socket.emit("chat_error", {
          message: "You are not a member of this conversation",
        });

        return;
      }

      const message = await Message.findOne({
        _id: messageId,
        conversationId,
      });

      if (!message) {
        return;
      }

      /**
       * Không cần đánh dấu tin nhắn của
       * chính mình là đã đọc.
       */
      if (message.senderId.toString() === socket.userId) {
        return;
      }

      message.isRead = true;

      await message.save();

      /**
       * Thông báo cho những client khác
       * trong conversation.
       */
      socket.to(`conversation:${conversationId}`).emit("message_read", {
        messageId,
        conversationId,
        userId: socket.userId,
      });
    } catch (error) {
      console.error("message_read error:", error);
    }
  });
};
