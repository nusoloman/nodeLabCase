const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const elastic = require('../services/elasticsearch');
const User = require('../models/User');
const PAGE_SIZE = 50;

/**
 * @swagger
 * /api/search/messages:
 *   get:
 *     summary: Search messages by content
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
router.get('/messages', authMiddleware, async (req, res) => {
  const q = req.query.q;
  const conversationId = req.query.conversationId;
  if (!q) return res.status(400).json({ message: 'Query required' });
  try {
    const results = await elastic.searchMessages(q, conversationId);
    // sender ve receiver id'lerini topla
    const userIds = Array.from(
      new Set(results.flatMap((r) => [r.sender, r.receiver]))
    );
    const users = await User.find(
      { _id: { $in: userIds } },
      '_id username email'
    );
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = {
        _id: u._id,
        username: u.username,
        email: u.email,
      };
    });
    // Eğer conversationId varsa, her mesaj için page bilgisini hesapla
    let enrichedResults = results.map((r) => ({
      ...r,
      sender: userMap[r.sender] || r.sender,
      receiver: userMap[r.receiver] || r.receiver,
    }));

    // Her mesaj için page bilgisini hesapla (genel arama için)
    const Message = require('../models/Message');
    enrichedResults = await Promise.all(
      enrichedResults.map(async (r) => {
        const msgConversationId = conversationId || r.conversation;
        // Sadece id'leri çek
        const allMsgIds = await Message.find({
          conversation: msgConversationId,
        })
          .sort({ createdAt: 1 })
          .select('_id');
        const idList = allMsgIds.map((m) => m._id.toString());
        const total = idList.length;
        const pageCount = Math.ceil(total / PAGE_SIZE);

        // Elastic'ten dönen id'yi string'e çevir
        const msgId = r.id?.toString() || r._id?.toString();
        const idx = idList.indexOf(msgId);
        // Eşleşmeyenlerde page -1 olarak işaretle
        let page = -1;
        if (idx !== -1) {
          page = pageCount - Math.floor(idx / PAGE_SIZE);
        }
        return { ...r, page };
      })
    );
    res.json({ results: enrichedResults });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

module.exports = router;
