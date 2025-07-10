/**
 * @swagger
 * tags:
 *   name: Message
 *   description: Messaging endpoints
 */

/**
 * @swagger
 * /api/message/send:
 *   post:
 *     summary: Send a message
 *     tags: [Message]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiver
 *               - content
 *             properties:
 *               receiver:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/message/auto-send:
 *   post:
 *     summary: Send an auto message (to queue)
 *     tags: [Message]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
 *               - content
 *               - sendDate
 *             properties:
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               content:
 *                 type: string
 *               sendDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: AutoMessage queued
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/message/history/{conversationId}:
 *   get:
 *     summary: Get message history for a conversation
 *     tags: [Message]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message history
 *       401:
 *         description: Unauthorized
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body, validationResult } = require('express-validator');

router.post(
  '/send',
  authMiddleware,
  [
    body('receiver').isString().notEmpty(),
    body('content').isString().notEmpty().isLength({ min: 1, max: 1000 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  messageController.send
);
router.post('/auto-send', authMiddleware, messageController.autoSend);
router.get(
  '/history/:conversationId',
  authMiddleware,
  messageController.history
);
// Mesajı iletildi (delivered) olarak işaretle
router.patch(
  '/:messageId/delivered',
  authMiddleware,
  messageController.markAsDelivered
);
// Mesajı okundu (seen) olarak işaretle
router.patch('/:messageId/seen', authMiddleware, messageController.markAsSeen);

module.exports = router;
