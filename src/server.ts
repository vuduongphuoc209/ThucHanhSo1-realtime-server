import http from "http";
import app from "./app";
import { connectDatabase } from "./config/database";
import { initializeSocket } from "./socket/socket";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

    console.log(`Socket.IO running on port ${PORT}`);
  });
};

startServer();
