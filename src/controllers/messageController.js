const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const AutoMessage = require('../models/AutoMessage');
const rabbitmqService = require('../services/rabbitmqService');

// Mesaj gönderme işlemi: Eğer konuşma yoksa oluştur, varsa mevcut konuşmaya ekle
async function send(req, res) {
  try {
    const { receiver, content } = req.body;
    const sender = req.user._id;
    if (!receiver || !content) {
      return res.status(400).json({ message: 'Receiver and content required' });
    }
    // Katılımcıların ikili kombinasyonunu bul
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver], $size: 2 },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, receiver],
      });
    }
    const message = await Message.create({
      sender,
      receiver,
      content,
      conversation: conversation._id,
    });
    res.status(201).json({
      message: 'Message sent',
      data: message,
      conversationId: conversation._id,
    });
  } catch (err) {
    // Hataları global error handler'a ilet
    return res
      .status(500)
      .json({ message: 'Failed to send message', error: err.message });
  }
}

// Belirli bir konuşmanın mesaj geçmişini getirir
async function history(req, res) {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username email')
      .populate('receiver', 'username email');
    res.json({ messages });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch messages', error: err.message });
  }
}

// AutoMessage'ı RabbitMQ kuyruğuna gönderir
async function autoSend(req, res) {
  try {
    const { from, to, content, sendDate } = req.body;
    if (!from || !to || !content || !sendDate) {
      return res.status(400).json({ message: 'All fields required' });
    }
    const autoMsg = await AutoMessage.create({
      from,
      to,
      content,
      sendDate,
      isQueued: false,
      isSent: false,
    });
    // Kuyruğa atma işlemi cronjob tarafından yapılacak
    res.status(201).json({ message: 'AutoMessage created', data: autoMsg });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to create auto message', error: err.message });
  }
}

// Mesajı iletildi (delivered) olarak işaretle
async function markAsDelivered(req, res) {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { delivered: true, deliveredAt: new Date() },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Socket.IO ile ilgili conversation odasına event emit et
    if (req.app && req.app.get('io')) {
      req.app
        .get('io')
        .to(message.conversation.toString())
        .emit('message_delivered', {
          messageId: message._id,
          conversationId: message.conversation,
          deliveredAt: message.deliveredAt,
        });
    }

    res.json({ message });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to mark as delivered', error: err.message });
  }
}

// Mesajı okundu (seen) olarak işaretle
async function markAsSeen(req, res) {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { seen: true, seenAt: new Date() },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Socket.IO ile ilgili conversation odasına event emit et
    if (req.app && req.app.get('io')) {
      req.app
        .get('io')
        .to(message.conversation.toString())
        .emit('message_seen', {
          messageId: message._id,
          conversationId: message.conversation,
          seenAt: message.seenAt,
        });
    }

    res.json({ message });
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to mark as seen', error: err.message });
  }
}

module.exports = {
  send,
  history,
  autoSend,
  markAsDelivered,
  markAsSeen,
};
