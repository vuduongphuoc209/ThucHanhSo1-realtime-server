import { Server } from "socket.io";

import User from "../../models/User";

import { AuthenticatedSocket } from "../socketAuth";

export const registerPresenceEvents = (
  io: Server,
  socket: AuthenticatedSocket,
) => {
  if (!socket.userId) {
    return;
  }

  /**
   * USER ONLINE
   */
  User.findByIdAndUpdate(
    socket.userId,
    {
      status: "online",
    },
    {
      new: true,
    },
  ).catch((error) => {
    console.error("Failed to update online status:", error);
  });

  socket.broadcast.emit("user_online", {
    userId: socket.userId,
  });

  /**
   * USER DISCONNECT
   */
  socket.on("disconnect", async () => {
    try {
      if (!socket.userId) {
        return;
      }

      await User.findByIdAndUpdate(socket.userId, {
        status: "offline",
        lastSeen: new Date(),
      });

      socket.broadcast.emit("user_offline", {
        userId: socket.userId,
        lastSeen: new Date(),
      });
    } catch (error) {
      console.error("Disconnect presence error:", error);
    }
  });
};
