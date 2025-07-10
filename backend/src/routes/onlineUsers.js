/**
 * @swagger
 * tags:
 *   name: OnlineUsers
 *   description: Online user endpoints
 */

/**
 * @swagger
 * /api/online-users:
 *   get:
 *     summary: Get list of online users
 *     tags: [OnlineUsers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of online users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
const express = require('express');
const router = express.Router();
const onlineUserService = require('../services/onlineUserService');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    // id'lerden user bilgilerini çek
    const users = await onlineUserService.getOnlineUsers();
    // users dizisi id'lerden oluşuyorsa, User modelinden username/email çek
    const User = require('../models/User');
    const userList = await User.find(
      { _id: { $in: users } },
      '_id username email'
    );
    res.json({ users: userList });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to fetch online users', error: err.message });
  }
});

module.exports = router;
