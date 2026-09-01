import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const authenticateSocket = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(new Error("JWT_SECRET is not configured"));
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded.userId) {
      return next(new Error("Invalid token"));
    }

    socket.userId = decoded.userId;

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};
