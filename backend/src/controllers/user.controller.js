import { pool } from "../db/pool.js";

export const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `
      SELECT id, username, email, is_online, avatar_url
      FROM users
      WHERE id != ?
      ORDER BY is_online DESC, username ASC
      `,
      [req.user.id]
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};