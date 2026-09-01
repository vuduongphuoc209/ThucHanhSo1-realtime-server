import { Server } from "socket.io";
import http from "http";

import { authenticateSocket } from "./socketAuth";

import { registerChatEvents } from "./events/chat.events";

import { registerPresenceEvents } from "./events/presence.events";

export const initializeSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:4080",

      credentials: true,
    },
  });

  /**
   * Authentication middleware
   */
  io.use(authenticateSocket);

  /**
   * Connection
   */
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // console.log(`User ID: ${socket.userId}`);

    registerChatEvents(io, socket);

    registerPresenceEvents(io, socket);
  });

  return io;
};
