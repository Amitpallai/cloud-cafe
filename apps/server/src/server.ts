import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";

import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";
import { setSocketServer } from "./sockets/socket-instance.js";

async function bootstrap() {
  await prisma.$connect();

  console.log("NeonDB connected successfully");

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  setSocketServer(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });



  httpServer.listen(env.PORT, () => {
    console.log(`Cloud Café API: http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    console.log("Shutting down Cloud Café API...");

    httpServer.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch(async (error) => {
  console.error("Server startup failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});

