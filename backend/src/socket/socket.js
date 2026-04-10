import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

let io;
let allMessages = []; // In-memory message storage (replace with DB in production)
let onlineUsers = new Map();

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
      socket.userId = decoded.id;
      socket.userName = decoded.username || decoded.email;

      next();
    } catch (error) {
      console.error("❌ Socket authentication error:", error.message);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const userName = socket.userName;

    console.log(`✅ User connected: ${userId} (${socket.id})`);

    // Track online users
    onlineUsers.set(userId, {
      socketId: socket.id,
      userName,
      connectedAt: new Date(),
    });

    // Set user online in database
    try {
      await pool.execute(
        "UPDATE users SET is_online = TRUE WHERE id = ?",
        [userId]
      );
    } catch (error) {
      console.error("Failed to update user online status:", error.message);
    }

    // Broadcast online users count
    io.emit("users-online", onlineUsers.size);
    console.log(`👥 Online users: ${onlineUsers.size}`);

    // Send existing messages to newly connected user
    socket.emit("load-messages", allMessages);
    console.log(`📂 Sent ${allMessages.length} existing messages to ${userId}`);

    /**
     * Receive message from client and broadcast to all users
     */
    socket.on("send-message", async (msg, callback) => {
      try {
        console.log(`📤 Message from ${userId}:`, msg.text);

        if (!msg.text || msg.text.trim().length === 0) {
          console.warn("⚠️ Empty message rejected");
          callback({ success: false, error: "Message cannot be empty" });
          return;
        }

        // Create message object
        const newMessage = {
          id: msg.id || `${Date.now()}-${Math.random()}`,
          text: msg.text.trim(),
          sender: userId,
          senderName: userName,
          timestamp: new Date().toISOString(),
        };

        // Save to in-memory array
        allMessages.push(newMessage);

        // Keep only last 100 messages in memory
        if (allMessages.length > 100) {
          allMessages = allMessages.slice(-100);
        }

        // Broadcast to ALL connected clients
        io.emit("receive-message", newMessage);
        console.log(`✅ Message broadcast to all users`);

        // Save to database (optional, for persistence)
        try {
          await pool.execute(
            "INSERT INTO messages (sender_id, content) VALUES (?, ?)",
            [userId, newMessage.text]
          );
        } catch (dbError) {
          console.warn("Failed to save message to database:", dbError.message);
        }

        // Acknowledge to sender
        callback({ success: true, messageId: newMessage.id });
      } catch (error) {
        console.error("❌ Error processing message:", error.message);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on("disconnect", async () => {
      console.log(`👋 User disconnected: ${userId} (${socket.id})`);

      onlineUsers.delete(userId);

      // Set user offline in database
      try {
        await pool.execute(
          "UPDATE users SET is_online = FALSE WHERE id = ?",
          [userId]
        );
      } catch (error) {
        console.error("Failed to update user offline status:", error.message);
      }

      // Broadcast updated online users count
      io.emit("users-online", onlineUsers.size);
      console.log(`👥 Online users: ${onlineUsers.size}`);
    });

    /**
     * Handle socket errors
     */
    socket.on("error", (error) => {
      console.error(`❌ Socket error for ${userId}:`, error);
    });
  });
};