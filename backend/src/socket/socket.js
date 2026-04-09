import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  /**
   * Socket JWT authentication middleware
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;

      next();
    } catch (error) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    socket.join(userId.toString());

    /**
     * Set user online
     */
    await pool.execute(
      "UPDATE users SET is_online = TRUE WHERE id = ?",
      [userId]
    );

    io.emit("user_status", {
      userId,
      isOnline: true,
    });

    /**
     * Send message
     */
    socket.on("send_message", async ({ receiverId, content }) => {
      try {
        if (!receiverId || !content) return;

        const [result] = await pool.execute(
          "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
          [userId, receiverId, content]
        );

        const message = {
          id: result.insertId,
          sender_id: userId,
          receiver_id: receiverId,
          content,
          created_at: new Date(),
        };

        io.to(receiverId.toString()).emit("receive_message", message);
        socket.emit("receive_message", message);
      } catch (error) {
        console.error("send_message error:", error.message);
      }
    });

    /**
     * Disconnect handling
     */
    socket.on("disconnect", async () => {
      await pool.execute(
        "UPDATE users SET is_online = FALSE WHERE id = ?",
        [userId]
      );

      io.emit("user_status", {
        userId,
        isOnline: false,
      });
    });
  });
};