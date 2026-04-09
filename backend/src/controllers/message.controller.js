import { pool } from "../db/pool.js";

/**
 * Get chat history between two users
 */
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId } = req.params;

    const [messages] = await pool.execute(
      `
      SELECT *
      FROM messages
      WHERE 
        (sender_id = ? AND receiver_id = ?)
        OR
        (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
      `,
      [userId, receiverId, receiverId, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};