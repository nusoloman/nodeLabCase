const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const elastic = require('../services/elasticsearch');

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
  if (!q) return res.status(400).json({ message: 'Query required' });
  try {
    const results = await elastic.searchMessages(q);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

module.exports = router;
