const mongoose = require('mongoose');
const elastic = require('../services/elasticsearch');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: { type: String, required: true },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  // Yeni eklenen alanlar:
  delivered: { type: Boolean, default: false }, // karşıya iletildi mi (tek tik)
  deliveredAt: { type: Date }, // iletildiği zaman
  seen: { type: Boolean, default: false }, // okundu mu (çift tik ve mavi)
  seenAt: { type: Date }, // okunduğu zaman
});

messageSchema.index({ createdAt: 1 });

messageSchema.post('save', async function (doc) {
  try {
    await elastic.indexMessage(doc);
  } catch (err) {
    // Sessizce geç, loglanabilir
  }
});

module.exports = mongoose.model('Message', messageSchema);
