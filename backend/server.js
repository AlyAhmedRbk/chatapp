import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import messageRoutes from "./src/routes/message.routes.js";


import { errorHandler } from "./src/middleware/error.middleware.js";
import { authLimiter } from "./src/middleware/rateLimit.middleware.js";

import { initSocket } from "./src/socket/socket.js";
import { initDatabase } from "./src/db/init.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/**
 * Global middleware
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

/**
 * Rate limiting for auth routes
 */
app.use("/api/auth", authLimiter);

/**
 * Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

/**
 * Error handler
 */
app.use(errorHandler);

/**
 * Start server with database initialization
 */
const startServer = async () => {
  try {
    console.log("Initializing database...");

    await initDatabase();

    console.log("Database ready");

    initSocket(server);

    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  process.exit();
});

startServer();