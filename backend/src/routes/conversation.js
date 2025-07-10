/**
 * @swagger
 * tags:
 *   name: Conversation
 *   description: Conversation endpoints
 */

/**
 * @swagger
 * /api/conversation/list:
 *   get:
 *     summary: List all conversations for the user
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *       401:
 *         description: Unauthorized
 */
const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/list', authMiddleware, conversationController.list);

module.exports = router;
